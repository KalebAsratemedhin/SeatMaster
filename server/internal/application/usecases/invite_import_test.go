package usecases

import (
	"fmt"
	"strings"
	"testing"
)

func TestParseEmailsFromCSV(t *testing.T) {
	csv := "Name,Email\nAda,ada@example.com\n,bob@example.com\n"
	emails, err := parseInviteEmailsFromFile("guests.csv", []byte(csv))
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if len(emails) != 2 || emails[0] != "ada@example.com" {
		t.Fatalf("got %#v", emails)
	}
}

func TestNormalizeBulkEmails(t *testing.T) {
	out, err := normalizeBulkEmails([]string{" Ada@X.com ", "ada@x.com", "bob@y.com"})
	if err != nil {
		t.Fatal(err)
	}
	if len(out) != 2 || out[0] != "ada@x.com" || out[1] != "bob@y.com" {
		t.Fatalf("got %#v", out)
	}

	big := make([]string, 0, maxBulkInviteEmails+1)
	for i := 0; i < maxBulkInviteEmails+1; i++ {
		big = append(big, fmt.Sprintf("user%d@x.com", i))
	}
	_, err = normalizeBulkEmails(big)
	if err == nil || !strings.Contains(err.Error(), "too many") {
		t.Fatalf("want too many, got %v", err)
	}
}
