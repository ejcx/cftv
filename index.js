var workerrouter = new require('workerrouter')
var app = new workerrouter();
var bcrypt = require('bcryptjs');

const saltRounds = 10;
const userPrefix = "/users/"
const sessionPrefix = "/sessions/"
const cookieName = "EJCX"

function getCookie(request, name) {
  let result = ""
  const cookieString = request.headers.get("Cookie")
  if (cookieString) {
    const cookies = cookieString.split(";")
    cookies.forEach(cookie => {
      const cookiePair = cookie.split("=", 2)
      const cookieName = cookiePair[0].trim()
      if (cookieName === name) {
        const cookieVal = cookiePair[1]
        result = cookieVal
      }
    })
  }
  return result
}

async function auth(request) {
  const cookie = getCookie(request, cookieName)
  if (cookie) {
    return await getsession(cookie)
  }
  return false
}

function randombytes(n) {
  var buf = new Uint8Array(n)
  crypto.getRandomValues(buf)
  let r = Array.from(buf, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')

  return r
}

async function put(k, v) {
  return await ejcxnet.put(userPrefix+k, JSON.stringify(v))
}

async function get(k, v) {
  let b = await ejcxnet.get(userPrefix+k)
  if (!b) {
    return false;
  }
  let o = JSON.parse(b)
  return o
}

async function putsession(k, v) {
  return await ejcxnet.put(sessionPrefix+k, JSON.stringify(v))
}

async function getsession(k) {
  let b = await ejcxnet.get(sessionPrefix+k)
  if (!b) {
    return false;
  }
  let o = JSON.parse(b)
  return o
}

app.post('/login', async function(request) {
  try {
    const formData = await request.formData()
    const body = {}
    for (const entry of formData.entries()) {
      body[entry[0]] = entry[1]
    }
    if (!body.username || !body.password) {
      return Response.redirect("https://ejcx.net/?error=1", 302)
    }

    let username = body.username;
    let password = body.password;

    let b = await get(username)
    if (!b || !b.hash) {
      return Response.redirect("https://ejcx.net/?error=1", 302)
    }

    let success = bcrypt.compareSync(password, b.hash); 
    if (!success) {
      return Response.redirect("https://ejcx.net/?error=1", 302)
    }


    let cookie = randombytes(16)
    let session = {username: username}

    await putsession(cookie, session)
    let r = new Response("", {
      status: 301
    })
    cookieString = cookieName + "=" + cookie
    r.headers.set("Set-Cookie", cookieString + ";path=/; domain=ejcx.net; secure; HttpOnly; SameSite=None")
    r.headers.set("Location", "https://ejcx.net")
    return r
  } catch (e) {
    return new Response(e)
  }

})

app.post('/create-account', async function(request) {
  const formData = await request.formData()
  const body = {}
  for (const entry of formData.entries()) {
    body[entry[0]] = entry[1]
  }
  if (!body.username || !body.password) {
    return Response.redirect("/", 301)
  }
  let username = body.username;
  var salt = bcrypt.genSaltSync(10);
  var pwhash = bcrypt.hashSync(body.password, salt);
  
  let o = {hash: pwhash}
  await put(username, o)
  let b = await get(username)

  let cookie = randombytes(16)
  let session = {username: username}

  await putsession(cookie, JSON.stringify(session))
  return Response.redirect("https://ejcx.net", 301)
})

app.get('/signup', async function(request) {
  let h = new Headers({"Content-type":"text/html"})
  return new Response(`
<!DOCTYPE HTML><head></head><body>
<style>
  body {
    max-width:650px;
    margin: 2em auto 4em;
    padding: 0 1rem;
    line-height: 1.5;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    -webkit-font-smoothing: antialiased;
  }
  img {
    max-width: 450px;
    display: block;
    text-align: center;
    margin: 0 auto;
  }
  ul {
    list-style:none;
    padding-left:0;
  }
  li.spacer {
    padding-top:15px;
  }
  pre {
    background-color:#f1f1f1;
    padding:5px;
    border-radius:5px;
  }
</style>
<div class="categories"><a href="/">Login</a> | <a href="/signup">Signup</a> </div>
<h2>Create Account</h2>
<form action="/create-account" method="post">
  <label for="username">Username
  <input type="text" id="username" name="username">
  </label>
  <br/>

  <label for="password">Password
  <input type="password" id="password" name="password">
  </label>

  <br/>
  <input type="submit" value="Submit">
</form>
</body>
</html>`, {
  headers: h
}
)})

app.get('/', async function(request) {
  try {
    let session = await auth(request)
    if (session) {
      return new Response("Welcome, " + session.username + "!")
    }
  } catch (e) {
    return new Response(e)
  }
  
  let h = new Headers({"Content-type":"text/html"})
  return new Response(`
<!DOCTYPE HTML><head></head><body>
<style>
  body {
    max-width:650px;
    margin: 2em auto 4em;
    padding: 0 1rem;
    line-height: 1.5;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    -webkit-font-smoothing: antialiased;
  }
  img {
    max-width: 450px;
    display: block;
    text-align: center;
    margin: 0 auto;
  }
  ul {
    list-style:none;
    padding-left:0;
  }
  li.spacer {
    padding-top:15px;
  }
  pre {
    background-color:#f1f1f1;
    padding:5px;
    border-radius:5px;
  }
</style>
<div class="categories"><a href="/">Login</a> | <a href="/signup">Signup</a> </div>
<h2>Login</h2>
<form action="/login" method="post">
  <label for="username">Username
  <input type="text" id="username" name="username">
  </label>
  <br/>

  <label for="password">Password
  <input type="password" id="password" name="password">
  </label>

  <br/>
  <input type="submit" value="Submit">
</form>
</body>
</html>`, {
  headers: h
}
)})

addEventListener('fetch', event => {
  event.respondWith(app.listen(event));
})

