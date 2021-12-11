1.
me -> browser http://localhost:3000
-> Next.js server
-> Request graphql server localhost:4000
-> Building the HTML
-> Sending back to your browser


---------- After Enabling SSR -------------
In next JS when you load the page first time it will be SSR 
but if you switch to other page say login page and then again come back 
to the page which was server side rendered it will not be SSR, now it will
be Client Side Rendered(Using Client side routing).

