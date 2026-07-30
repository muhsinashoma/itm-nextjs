# Route registration

In the backend bootstrap/router file where the other handlers are constructed, add:

```go
troubleTicketHandler := handler.NewTroubleTicketHandler(db)
troubleTicketHandler.Register(apiV1)
```

Use the actual `*pgxpool.Pool` and `*gin.RouterGroup` variable names from your project.
