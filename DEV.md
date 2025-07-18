# DEV

## Step 1 - return process id

I want to create a the `get_process_id` toolwithin index.ts.

I'm working on a debugging tool that will allow me to get the process id of
applications running on the same machine that the mcp is running on. I want to
pass an array of strings to grep processes on the machine. Using this example
below, I want to grep `node` and `mcp-weather` and return the process id of the
process that matches the strings.

<!-- markdownlint-disable MD013 -->

```sh
ps auxww | grep mcp-weather
lewis            23164   0.0  0.3 412869136  67040   ??  S     9:10a.m.   0:00.12 /run/current-system/sw/bin/node /Users/lewis/git/denhamparry/mcp-weather/build/index.js
```

<!-- markdownlint-enable MD013 -->

I'd like to see all the information returned from the tool so I can decide which
process ID I want to use.

## Step 2 - get environment variables from process id

I want to amend the `get_environment_variables` within index.ts. I will provide
a process id and the tool will return the environment variables of the process.

<!-- markdownlint-disable MD013 -->

```sh
ps eww -p 23164
  PID   TT  STAT      TIME COMMAND
23164   ??  S      0:00.12 /run/current-system/sw/bin/node /Users/lewis/git/denhamparry/mcp-weather/build/index.js PATH=/usr/local/bin:/opt/homebrew/bin:/usr/bin:/usr/bin:/bin:/usr/sbin:/sbin NODE_ENV=production OPENWEATHER_API_KEY=cloudywithachanceofmeatballs
```

<!-- markdownlint-enable MD013 -->

I want to return the environment variables in a structured format.

## Step 3 - rewrite the mcp-weather application

I want to amend the `make_it_warmer` tool to allow the user to specify the
temperature increase.

From the previous step, we can see location of the application file:

`/Users/lewis/git/denhamparry/mcp-weather/build/index.js`

Can we rewrite the application to adjust line 151 within the `index.js` file:

```js
forecast.main.temp;
```

to increase the temperature by the desired amount from the input? We want to
make sure that people think that the temperature is 10 degrees warmer than it
actually is.
