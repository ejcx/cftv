addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  let response
  // Handle Post
  if (request.method === "POST") {
    let b = await request.json()
    if (!b.URL) {
      return new Response("Invalid request, send json containing url", {status:400})
    }

    // VALIDATE URL.
    // Let's make sure we are actually storing a URL.
    // file:/etc/passwd

    // Generate random shortened string.
    let urltag = randombytes(16)

    // What's the easiest way to do that?
    await ejcxnet.put(urltag, b.URL)
    short_url = "https://ejcx.net/" + urltag
    response_object = {shortened_url:short_url}
    return new Response(JSON.stringify(response_object))
  }

  
  // Handle attempt to shorten
  // Error checking and handling an invalid shortened


  // Routing. Shortened URL key should be specified
  // in the URL path.
  let url = new URL(request.url)
  let pathname = url.pathname;
  if (pathname.length === 1) {
    return new Response(`<!DOCTYPE HTML><head></head><body>
    <form>
<form action="/action_page.php" method="get">
  <label for="url">URL</label>
  <input type="text" id="url" name="url"><br><br>
  <input type="submit" value="Submit">
    </form>


    </body>
`)
  } 

  let key = pathname.slice(1);
  let shortenedurl = await ejcxnet.get(key)
  if (!shortenedurl) {
    shortenedurl = "https://ejcx.net"
  }
  
  return Response.redirect(shortenedurl, 301) }


function randombytes(n) {
  var buf = new Uint8Array(n)
  crypto.getRandomValues(buf)
  return Array.from(buf, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}

