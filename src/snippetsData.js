export const SNIPPETS_LIBRARY = [
  {
    title: 'Reactive Watchdog (Try-Unless)',
    category: 'Reactive State',
    description: 'Monitors variable mutation and triggers automatic reactive fallback blocks.',
    code: `! Reactive Watchdog Block
set temperature: 80

do:
    display "Monitoring turbine temperature..." ?color=cyan
    set temperature: temperature + 30
unless internal temperature > 100:
    display "⚠️ High Temperature Triggered! Cooling down..." ?color=red
`
  },
  {
    title: 'High-Throughput Channel',
    category: 'Concurrency',
    description: 'Thread-safe FIFO channels with bounded capacity for message passing.',
    code: `! Concurrency Channel Pipeline
set dataQueue: chan(5)

send dataQueue <- "Task A"
send dataQueue <- "Task B"

recv task1 <- dataQueue
recv task2 <- dataQueue

display "Processed: " + task1 + ", " + task2 ?color=green
`
  },
  {
    title: 'Event Listener & Emitter',
    category: 'Events',
    description: 'Event-driven architecture with custom asynchronous triggers.',
    code: `! Event Handler & Emitter
on "userLogin":
    display "Auth event caught! Logging to audit log..." ?color=purple

emit "userLogin" ?data="User: Alice"
`
  },
  {
    title: 'Constrained Scalar DataType',
    category: 'Type Safety',
    description: 'Sub-primitive constrained scalar types with runtime contract enforcement.',
    code: `! Constrained Scalar Types
DataType PortNumber extends num:
    it >= 1 & it <= 65535

DataType Positive extends num:
    it > 0

set serverPort: 8080
display "Configured server port: " + serverPort ?color=cyan
`
  },
  {
    title: 'Polyglot Code Injection',
    category: 'Interop',
    description: 'Directly executes and interoperates with code in Python, JS, C, and 100+ languages.',
    code: `! Multi-Language Code Injection
inject python:
    import math
    print(f"[Python Injected] Square root of 256 is: {math.sqrt(256)}")
`
  },
  {
    title: 'Matrix Determinant & Inverse',
    category: 'Linear Algebra',
    description: 'Native Matrix core library for advanced numerical computing.',
    code: `! Matrix Operations
load Matrix

set M: [[3, 8], [4, 6]]
set det: Matrix.det(M)
set inv: Matrix.inverse(M)

display "Determinant: " + det ?color=yellow
display "Inverse Matrix:" ?color=green
display inv
`
  }
];
