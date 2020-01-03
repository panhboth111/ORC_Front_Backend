//....
import auth from './auth'

var syncLog = function (event) {
    if (event.key === 'LastLogged') {
      auth()
    }
  }

export default window.addEventListener('storage', syncLog)