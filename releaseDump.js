// { overwrite: true,
//   repo: 'brigadehub/brigadehub',
//   path: '/Users/therebelrobot/git/github.com/brigadehub/brigadehub',
//   output: 'CHANGELOG.md',
//   token: '0cb2be5f7710b79650a77243597b1edc80b7406d' }

const request = require('superagent')
const _ = require('lodash')
const fs = require('fs')


module.exports = function releaseDump (options){
  return new Promise((resolve, reject) => {
    getAllReleases(options, (releases) => {
      releases = _.sortBy(releases, 'published_at').reverse()
      const changelog = buildChangeLog(releases)
      console.log(changelog)
      const filepath = `${options.path}/${options.output}`
      try {
        stats = fs.lstatSync(filepath)
        if (!options.overwrite) {
          return reject('File already exists. Please move file, or specify overwrite flag.')
        }
        if (!stats.isFile()) {
          return reject(filepath + ' exists, but is not a file! Cannot overwrite!')
        }
        fs.unlink(filepath, function(err){
          if (err && err.code !== 'ENOENT') return reject(err)
          var options = { flag : 'w' };
          fs.writeFile(filepath, changelog, options, function(err) {
              if (err) return reject(err)
              resolve()
          });
      });
      } catch (e) {
        fs.writeFile(filepath, changelog, options, function(err) {
            if (err) return reject(err)
            resolve()
        });
      }
    })
  })
}

function getAllReleases (options, cb, releases, url) {
  releases = releases || []
  request.get(url || `https://api.github.com/repos/${options.repo}/releases`)
    .set('Authorization', `Token ${options.token}`)
    .set('User-Agent', 'Github Release Dump')
    .type('json')
    .accept('json')
    .end((err, response) => {
      if(!response.body || !response.body.length) return cb(releases)
      const newReleases = response.body.map(repo => {
        if(repo.body.indexOf('\r\n') > -1) repo.body = repo.body.split('\r\n').join('\n')
        return {
          name: repo.name,
          body: repo.body,
          published_at: repo.published_at
        }
      })
      releases = releases.concat(newReleases)
      console.log(response.headers)
      if (response.headers.link && response.headers.link.indexOf('>; rel="next"') > -1) {
        let link
        if(response.headers.link.indexOf(',') > -1) {
          link = response.headers.link.split(',')
        } else {
          link = [response.headers.link]
        }
        let newUrl
        link.forEach(relLink => {
          if(relLink.indexOf('rel="next"') > -1){
            relLink = relLink.split('>;')[0]
            relLink = relLink.split('<')[1]
            newUrl = relLink
          }
        })
        if(!newUrl) return cb(releases)
        return getAllReleases(options, cb, releases, newUrl)
      }
      cb(releases)
    })
}
function buildChangeLog (releases) {
  const changelog = []
  releases.forEach(release => {
    changelog.push(`
# ${release.name || 'Unnamed Release'} | published *${release.published_at}*

${release.body}
`)
  })
  return changelog.join('\n')
}
