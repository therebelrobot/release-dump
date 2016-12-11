const fs = require('fs')

module.exports = function getGitRepo () {
  try {
    var gitConfigPath = [
      process.cwd(),
      '.git/config'
    ].join('/')
    var gconf = fs.readFileSync(gitConfigPath, 'utf8')
    gconf = gconf.split(/\r?\n/)
    var i = gconf.indexOf('[remote "origin"]')
    if (i !== -1) {
      var url = gconf[i + 1]
      if (!url.match(/^\s*url =/)) {
        url = gconf[i + 2]
      }
      if (!url.match(/^\s*url =/)) {
        url = null
      } else {
        url = url.replace(/^\s*url = /, '')
      }
    }
    if (url && url.match(/^ssh:\/\/git@github.com\//)) {
      url = url.replace(/^ssh:\/\/git@github.com\//, '')
    }
    if (url && url.match(/^https:\/\/github.com\//)) {
      url = url.replace(/^https:\/\/github.com\//, '')
    }
    if (url && url.match(/\.git$/)) {
      url = url.replace(/\.git$/, '')
    }
    return url
  } catch(e) {
    return ''
  }
}
