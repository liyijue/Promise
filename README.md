# PromiseA+ 规范

## 术语

1. promise 是一个有 then 方法的对象或者函数, 行为遵循 promiseA+ 规范
2. thenable 是一个有 then 方法的对象或者函数
3. value 是 promise 状态成功时的值, 也就是 resolve 的参数. 包括各种数据类型, undefinde / number boolean promise
4. reason 是 promise 状态失败时的值, 也就是 reject 的参数, 表示拒绝的原因.
5. exception throw 抛出去的异常

## 规范

### Promise States

promise 应该有三种状态, 要注意他们之间的流转关系.

resolve reject 是动作
fulfilled rejected 是状态, 是动作的结果.

1. pending

   1.1 初始的状态, 可改变.
   1.2 一个 promise 在被 resolve 或者 reject 之前, 都处于这个状态
   1.3 通过 resolve => fulfilled
   1.4 通过 reject => rejected

2. fulfilled

   2.1 最终态, 不可以改变
   2.2 一个 promise 经过 resolve 后变为这个状态
   2.3 必须拥有一个 value 值

3. rejected

   2.1 最终态, 不可以改变
   2.2 一个 promise 经过 reject 后变为这个状态
   2.3 必须拥有一个 reason 值

pedding => resolve(value) => fulfilled
pedding => reject(reason) => rejected

### then

Promise 应该提供一个 then 方法, 用来访问最终的结果, 无论是 value 还是 reason

```javascript
promise.then(onFullFilled, onRejected);
```

1. 参数要求

   1.1 onFulFilled 必须是函数类型, 如果不是函数, 应该被忽略
   1.2 onRejected 必须是函数类型, 如果不是函数, 应该被忽略

2. onFulfilled 特性

   2.1 在 promise 变为 fulfilled 时, 应该调用 onFulfilled, 参数是 value
   2.2 在 promise 变为 fulfilled 之前, 不应该被调用
   2.3 只能被调用一次 (需要一个变量来限制执行次数)

3. onRejected 特性

   2.1 在 promise 变为 rejected 时, 应该调用 onRejected, 参数是 reason
   2.2 在 promise 变为 rejected 之前, 不应该被调用
   2.3 只能被调用一次

4. onFulfilled 和 onRejected 应该是微任务

   queueMicrotask 实现微任务的调用

5. then 方法可以被调用多次

   5.1 promise 变成 fulfilled 后, 所有的 onFulfilled 的回调都应该按照 then 的顺序执行
   在实现 promise 的时候, 咱们需要一个数组来存储 onFulfilled 的 cb (回调)

   5.2 promise 变成 rejected 后, 所有的 onRejected 的回调都应该按照 then 的顺序执行
   在实现 promise 的时候, 咱们需要一个数组来存储 onRejected 的 cb (回调)

6. 返回值
   6.1 onFulfilled 或者 onRejected 执行的结果为 x, 调用 resolvePromise
   6.2 onFulfilled 或者 onRejected 执行时抛出异常, promise2 需要被 reject
   6.3 如果 onFulfilled 不是一个函数, promise2 以 promise1 的 value 触发 fulfilled
   6.4 如果 onRejected 不是一个函数, promise2 以 promise1 的 reason 触发 rejected

   then 返回值是一个 promise. 新的?旧的? => 新的

   ```js
   promise2 = promise1.then(onFulfilled, onRejected);
   ```

7. resolvePromise
   7.1 如果 promise2 和 x 相等, 那么 reject TypeError
   7.2 如果 x 是一个 promise
   如果 x 是 pending, promise 的状态必须也是等待 / pending, 直到 x 变成了 fulfilled / rejected
   如果 x 是 fulfilled, fulfill promise with the same value
   如果 x 是 rejected, reject promise with the same reason

   7.3 如果 x 是一个 Object 或者 是一个 function

   let then = x.then
   如果 x.then 这一步出错了, try catch(e), reject(e)
   如果 then 是一个函数, then.call(x, resolvePromiseFn, rejectPromiseFn)

   resolvePromiseFn 的入参是 y, 执行 resolvePromise(promise2, y, resolve, reject))
   如果调用 thne 的时候抛出了异常 e, reject reason

   ```js
   resolvePromise(promise2, x, resolve, reject);
   ```
