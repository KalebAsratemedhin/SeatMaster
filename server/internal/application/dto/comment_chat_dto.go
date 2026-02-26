package dto

// EventCommentResponse is a public comment on an event.
type EventCommentResponse struct {
	ID        string  `json:"id"`
	EventID   string  `json:"event_id"`
	ParentID  *string `json:"parent_id,omitempty"`
	UserID    string  `json:"user_id"`
	Author    string  `json:"author"` // display name: "First Last" or email
	Body      string  `json:"body"`
	CreatedAt string  `json:"created_at"`
}

// CreateEventCommentRequest is the body for posting a comment.
type CreateEventCommentRequest struct {
	Body     string  `json:"body"`
	ParentID *string `json:"parent_id,omitempty"`
}

// PaginatedCommentsResponse for GET /events/:id/comments.
type PaginatedCommentsResponse struct {
	Items []*EventCommentResponse `json:"items"`
	Total int64                   `json:"total"`
}

// EventChatThreadResponse is a 1:1 thread between owner and one guest.
type EventChatThreadResponse struct {
	ID        string `json:"id"`
	EventID   string `json:"event_id"`
	OwnerID   string `json:"owner_id"`
	GuestID   string `json:"guest_id"`
	GuestName string `json:"guest_name"` // display name for the other participant
	CreatedAt string `json:"created_at"`
}

// EventChatMessageResponse is a message in a thread.
type EventChatMessageResponse struct {
	ID        string `json:"id"`
	ThreadID  string `json:"thread_id"`
	SenderID  string `json:"sender_id"`
	Body      string `json:"body"`
	CreatedAt string `json:"created_at"`
}

// PaginatedChatMessagesResponse for GET thread messages.
type PaginatedChatMessagesResponse struct {
	Items []*EventChatMessageResponse `json:"items"`
	Total int64                       `json:"total"`
}
