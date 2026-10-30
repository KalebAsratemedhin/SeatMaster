package services

import "context"

// InviteJobQueue enqueues durable background work for bulk invite jobs.
type InviteJobQueue interface {
	EnqueueInviteJob(ctx context.Context, inviteJobID string) error
}
