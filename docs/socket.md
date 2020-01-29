# Socket.io documentation

This project uses socket.io for realtime notification

## Connect

To connect, client need to pass a jwt token via query parameter on the host url

```
http://<url>?token=<jwt token>
```

For example

```
http://localhost:3000?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjYsInVzZXJuYW1lIjoidGVuYW50MTAiLCJlbWFpbCI6InRlbmFudDEwQGVtYWlsLmNvbSIsInJvbGUiOiJ0ZW5hbnQiLCJpYXQiOjE1ODAyMTg4MDJ9.BY8mz-4zWXAwnFDDDfURiQjk1SmvtVywEcwJOF-BUDA
```

## Message

Notification will be sent to the `transaction` event. There are 3 types of `transaction` event

- give
```
{
	type: "give",
	from:{
		id: int,
		name: string
	},
  amount: int
}
```
- redeem
```
{
	type: "redeem",
	item:{
		id: int,
		name: string
	},
  amount: int
}
```
- play
```
{
	type: "give",
	tenant:{
		id: int,
		name: string
	},
  amount: int
}
```



