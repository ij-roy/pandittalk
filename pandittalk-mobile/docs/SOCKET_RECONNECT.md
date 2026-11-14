# Socket reconnect

The chat socket does not retry on its own every two seconds. After a drop it waits 2 seconds, then 4, then 8, up to 30 seconds, and only one retry is pending. A connection that stays up for 10 seconds starts that wait over at 2 seconds.
