package usecases

import (
	"bytes"
	"encoding/csv"
	"errors"
	"io"
	"strings"

	"github.com/xuri/excelize/v2"
)

func parseInviteEmailsFromFile(filename string, data []byte) ([]string, error) {
	if len(data) == 0 {
		return nil, errors.New("file is empty")
	}
	name := strings.ToLower(strings.TrimSpace(filename))
	switch {
	case strings.HasSuffix(name, ".csv"):
		return parseEmailsFromCSV(data)
	case strings.HasSuffix(name, ".xlsx"), strings.HasSuffix(name, ".xlsm"):
		return parseEmailsFromXLSX(data)
	default:
		return nil, errors.New("unsupported file type (use .csv or .xlsx)")
	}
}

func parseEmailsFromCSV(data []byte) ([]string, error) {
	r := csv.NewReader(bytes.NewReader(data))
	r.TrimLeadingSpace = true
	r.FieldsPerRecord = -1
	header, err := r.Read()
	if err != nil {
		return nil, errors.New("csv must include a header row with an email column")
	}
	col, ok := findEmailColumn(header)
	if !ok {
		return nil, errors.New("csv header must include an email column")
	}
	var emails []string
	for {
		row, err := r.Read()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return nil, errors.New("invalid csv")
		}
		if col >= len(row) {
			continue
		}
		emails = append(emails, row[col])
	}
	return emails, nil
}

func parseEmailsFromXLSX(data []byte) ([]string, error) {
	f, err := excelize.OpenReader(bytes.NewReader(data))
	if err != nil {
		return nil, errors.New("invalid xlsx file")
	}
	defer f.Close()
	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, errors.New("xlsx has no sheets")
	}
	rows, err := f.GetRows(sheets[0])
	if err != nil {
		return nil, errors.New("failed to read xlsx")
	}
	if len(rows) == 0 {
		return nil, errors.New("xlsx must include a header row with an email column")
	}
	col, ok := findEmailColumn(rows[0])
	if !ok {
		return nil, errors.New("xlsx header must include an email column")
	}
	var emails []string
	for _, row := range rows[1:] {
		if col >= len(row) {
			continue
		}
		emails = append(emails, row[col])
	}
	return emails, nil
}

func findEmailColumn(header []string) (int, bool) {
	for i, h := range header {
		key := strings.ToLower(strings.TrimSpace(h))
		key = strings.TrimPrefix(key, "\ufeff") // BOM
		if key == "email" || key == "e-mail" || key == "email address" {
			return i, true
		}
	}
	return 0, false
}
