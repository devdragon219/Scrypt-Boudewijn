type Side = "buy" | "sell"
type OrderType = "Market" | "Limit" | "LimitAllIn" | "RFQ"
type TimeInForce = "GoodTillCancel" | "FillAndKill" | "FillOrKill" | "PostOnly"
type OrderStatus = "PartiallyFilled" | "Filled" | "Canceled" | "PendingCancel" | "Rejected" | "PendingNew" | "PendingReplace" | "DoneForDay"
type ExecutionType = "New" | "Trade" | "Canceled" | "Replaced" | "PendingCancel" | "Stopped" | "Rejected" | "PendingNew" | "Restated" | "PendingReplace" | "CancelRejected" | "ReplaceRejected" | "DoneForDay" | "PendingResume" | "Resumed" | "PendingPause" | "Paused" | "Triggered" | "Started"
type SecurityType = "spot" | "perpetual-swap" | "future-option" | "synthetic"
type OrderbookStatus = "Online" | "Offline"
type Order = {
  id: string // client order id
  user: string // name of the algorithm
  markets: string[]
  symbol: string // trading pair separated by '/', e.g. 'BTC/USD'
  side: Side
  quantity: number
  price?: number
  type: OrderType
  timeinforce: TimeInForce
}
type Command = {
  command: {place: Order} | {amend: Order} | {cancel: string /*id*/} | "cancel-all"
}
type Execution = Order & {
  time: Date
  exectype: ExecutionType
  status: OrderStatus
  filled: {
    quantity: number
    amount: number
  }
  average: {
    price: number
    priceAll?: number
  }
  last?: {
    price?: number
    quantity?: number
    amount?: number
    market?: string
  }
}
type Security = {
  symbol: string
  type: SecurityType
  currency: {
    base: string
    quote: string
    position?: string
    settlement?: string
  }
  markets: string[]
  price: {
    incr: {
      min: number
      default: number
    }
  }
  size: {
    min: number
    max: number
    incr: {
      min: number
      default: number
    }
    buckets: number[]
  }
}
type Trade = { // MarketDataTrade
  id: string
  time: Date // TransactTime
  symbol: string
  market: string
  price: number
  size: number
  side: string
}
type Orderbook = { // MarketDataSnapshot
  time: Date
  symbol: string
  status: OrderbookStatus
  bids: {price: number, size: number}[]
  offers: {price: number, size: number}[]
}
type Event = {
  event: {execution: Execution} | {security: Security} | {trade: Trade} | {orderbook: Orderbook}
}
type Status = {
  status: {} // TBD
}
type Message = [
  Command | Event | Status
]

// POST /alive {user: string|ttl: number, execute?: Command[]}
// e.g. POST /alive {user: "algo1", ttl: 400/*ms*/, execute: [command: "cancel-all"]}
// GET /orderbook {symbols?: string[]} → Orderbook[]
// GET /securities → Security[]
// GET /orders/{user} {status?: OrderStatus[], since?: Date} → Execution[]

