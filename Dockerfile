FROM golang:1.22-alpine AS builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=1 go build -o vault ./cmd/server/

FROM alpine:3.18

RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /app/vault .
COPY --from=builder /app/web ./web
COPY --from=builder /app/data ./data

EXPOSE 8080
CMD ["./vault"]
