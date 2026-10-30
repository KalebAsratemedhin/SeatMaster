package queue

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/riverdriver/riverpgxv5"
	"github.com/riverqueue/river/rivermigrate"
	"github.com/riverqueue/river/rivertype"
)

// ProcessInviteJobArgs is the River payload for bulk invite processing.
type ProcessInviteJobArgs struct {
	InviteJobID string `json:"invite_job_id" river:"unique"`
}

func (ProcessInviteJobArgs) Kind() string { return "process_invite_job" }

func (ProcessInviteJobArgs) InsertOpts() river.InsertOpts {
	return river.InsertOpts{
		MaxAttempts: 3,
		UniqueOpts: river.UniqueOpts{
			ByArgs: true,
			ByState: []rivertype.JobState{
				rivertype.JobStateAvailable,
				rivertype.JobStatePending,
				rivertype.JobStateRunning,
				rivertype.JobStateRetryable,
				rivertype.JobStateScheduled,
			},
		},
	}
}

// InviteJobProcessor runs the invite job body (implemented by the usecase).
type InviteJobProcessor interface {
	ProcessInviteJob(ctx context.Context, inviteJobID string) error
	FailInviteJobByID(ctx context.Context, inviteJobID string, msg string) error
}

type processInviteJobWorker struct {
	river.WorkerDefaults[ProcessInviteJobArgs]
	processor InviteJobProcessor
}

func (w *processInviteJobWorker) Timeout(*river.Job[ProcessInviteJobArgs]) time.Duration {
	return 30 * time.Minute
}

func (w *processInviteJobWorker) Work(ctx context.Context, job *river.Job[ProcessInviteJobArgs]) (err error) {
	defer func() {
		if r := recover(); r != nil {
			msg := fmt.Sprintf("panic: %v", r)
			log.Printf("error: invite job %s %s", job.Args.InviteJobID, msg)
			_ = w.processor.FailInviteJobByID(context.Background(), job.Args.InviteJobID, msg)
			err = fmt.Errorf("%s", msg)
		}
	}()
	return w.processor.ProcessInviteJob(ctx, job.Args.InviteJobID)
}

// Client wraps River for invite jobs.
type Client struct {
	pool   *pgxpool.Pool
	client *river.Client[pgx.Tx]
	cancel context.CancelFunc
}

// NewClient migrates River schema, registers workers, and returns a queue client.
// Call Start after wiring the processor (EventUseCase).
func NewClient(ctx context.Context, databaseURL string, processor InviteJobProcessor) (*Client, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("river pgx pool: %w", err)
	}

	driver := riverpgxv5.New(pool)
	migrator, err := rivermigrate.New(driver, nil)
	if err != nil {
		pool.Close()
		return nil, fmt.Errorf("river migrator: %w", err)
	}
	if _, err := migrator.Migrate(ctx, rivermigrate.DirectionUp, nil); err != nil {
		pool.Close()
		return nil, fmt.Errorf("river migrate: %w", err)
	}

	workers := river.NewWorkers()
	river.AddWorker(workers, &processInviteJobWorker{processor: processor})

	riverClient, err := river.NewClient(driver, &river.Config{
		Queues: map[string]river.QueueConfig{
			river.QueueDefault: {MaxWorkers: 2},
		},
		Workers: workers,
	})
	if err != nil {
		pool.Close()
		return nil, fmt.Errorf("river client: %w", err)
	}

	return &Client{pool: pool, client: riverClient}, nil
}

// Start begins River workers. Safe to call once.
func (c *Client) Start(ctx context.Context) error {
	runCtx, cancel := context.WithCancel(ctx)
	c.cancel = cancel
	if err := c.client.Start(runCtx); err != nil {
		cancel()
		return err
	}
	return nil
}

// Stop gracefully stops workers and closes the pool.
func (c *Client) Stop(ctx context.Context) error {
	if c.cancel != nil {
		c.cancel()
	}
	if c.client != nil {
		if err := c.client.Stop(ctx); err != nil {
			log.Printf("error: river stop: %v", err)
		}
	}
	if c.pool != nil {
		c.pool.Close()
	}
	return nil
}

// EnqueueInviteJob inserts a durable River job for the invite_jobs row.
func (c *Client) EnqueueInviteJob(ctx context.Context, inviteJobID string) error {
	_, err := c.client.Insert(ctx, ProcessInviteJobArgs{InviteJobID: inviteJobID}, nil)
	return err
}
