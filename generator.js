function logTimeFn(time) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(time)
    }, time)
  })
}

function asyncFunc(generator) {
  const iterator = generator()

  const next = (data) => {
    const { value, done } = iterator.next(data)

    if (done) {
      return
    }

    value.then((data) => {
      next(data)
    })
  }

  next()
}

asyncFunc(function* () {
  let data = yield logTimeFn(1000)
  console.log(data)
  data = yield logTimeFn(2000)
  console.log(data)
  return data
})
