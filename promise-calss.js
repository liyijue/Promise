// getter setter
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejectd'

class MPromise {
  FULFILLED_CALLBACK_LIST = []
  REJECTED_CALLBACK_LIST = []
  _status = PENDING

  /**
   * 
   * @param {Function} fn (resolve, reject) =>  
   */
  constructor(fn) {
    // 初始状态为 pending
    this.status = PENDING
    this.value = null
    this.reason = null

    try {
      fn(this.resolve.bind(this), this.reject.bind(this))
    } catch (error) {
      this.reject(error)
    }
  }

  get status() {
    return this._status
  }

  set status(newStatus) {
    this._status = newStatus
    switch (newStatus) {
      case FULFILLED: {
        this.FULFILLED_CALLBACK_LIST.forEach(callback => {
          callback(this.value)
        })
        break
      }
      case REJECTED: {
        this.REJECTED_CALLBACK_LIST.forEach(callback => {
          callback(this.reason)
        })
        break
      }
    }
  }

  // resolve 用来 改变 promise 的状态
  resolve(value) {
    // promise 状态只允许在 pending 状态下才可以发生改变 且 不可逆
    if (this.status === PENDING) {
      this.value = value
      this.status = FULFILLED
    }
  }

  // reject 用来 改变 promise 的状态
  reject(reason) {
    if (this.status === PENDING) {
      this.reason = reason
      this.status = REJECTED
    }
  }

  // 当 promise 发生状态改变后调用对应的回调
  then(onFulfilled, onRejected) {
    const realOnFulfilled = this.isFunction(onFulfilled) ? onFulfilled : (value) => value
    const realOnRejected = this.isFunction(onRejected) ? onRejected : (reason) => { throw reason }

    // .then 的返回值整体是一个 promise
    const promise2 = new MPromise((resolve, reject) => {
      const fulfilledMicrotask = () => {
        queueMicrotask(() => {
          try {
            const x = realOnFulfilled(this.value)
            this.resolvePromise(promise2, x, resolve, reject)
          } catch (error) {
            reject(error)
          }
        })
      }

      const rejectedMicrotask = () => {
        queueMicrotask(() => {
          try {
            const x = realOnRejected(this.reason)
            this.resolvePromise(promise2, x, resolve, reject)
          } catch (error) {
            reject(error)
          }
        })
      }

      switch (this.status) {
        case FULFILLED: {
          fulfilledMicrotask()
          break
        }
        case REJECTED: {
          rejectedMicrotask()
          break
        }
        case PENDING: {
          this.FULFILLED_CALLBACK_LIST.push(fulfilledMicrotask)
          this.REJECTED_CALLBACK_LIST.push(rejectedMicrotask)
          break
        }
      }
    })

    return promise2
  }

  catch(onRejected) {
    return this.then(null, onRejected)
  }

  resolvePromise(promise2, x, reslove, reject) {
    // 7.1 如果 promise2 和 x 相等, 那么 reject TypeError
    if (promise2 === x) {
      return reject(new TypeError('The Promise and the reutrn value are the same'))
    }

    // 7.2 如果 x 是一个 promise
    if (x instanceof MPromise) {
      // 如果 x 是 promise, 那么让新的 promise 接受 x 的状态
      // 即继续执行 x, 如果执行的时候又拿到一个 y, 那么继续解析 y
      queueMicrotask(() => {
        x.then((y) => {
          this.resolvePromise(promise2, y, reslove, reject)
        }, reject)
      })
    } else if (typeof x === 'object' || this.isFunction(x)) {
      if (x === null) {
        return reslove(x)
      }

      let then = null;

      try {
        then = x.then
      } catch (error) {
        return reject(error)
      }

      if (this.isFunction(then)) {
        let called = false
        try {
          then.call(
            x,
            (y) => {
              if (called) {
                return
              }
              called = true
              this.resolvePromise(promise2, y, reslove, reject)
            },
            (r) => {
              if (called) {
                return
              }
              called = true
              reject(r)
            })
        } catch (error) {
          if (called) {
            return
          }
          reject(error)
        }
      } else {
        reslove(x)
      }
    } else {
      reslove(x)
    }
  }

  isFunction(param) {
    return typeof param === 'function'
  }

  static resolve(value) {
    if (value instanceof MPromise) {
      return value
    }

    return new MPromise((resolve) => {
      resolve(value)
    })
  }

  static reject(reason) {
    return new MPromise((resolve, reject) => {
      reject(reason)
    })
  }

  static race(promiseList) {
    return new MPromise((resolve, reject) => {
      const length = promiseList.length

      if (length === 0) {
        return resolve()
      } else {
        for (let i = 0; i < length; i++) {
          MPromise.resolve(promiseList[i]).then((value) => {
            return resovle(value)
          }, (reason) => {
            return reject(reason)
          })
        }
      }
    })
  }
}

const test = new MPromise((resolve, reject) => {
  setTimeout(() => {
    reject(111)
  }, 3000)
}).catch((reason) => {
  console.log('报错' + reason)
  console.log(test)
})

setTimeout(() => {
  console.log(test)
}, 1000)
