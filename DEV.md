# DEV

## Step 1

I want to ammend the `get_environment_variables` within index.ts.

I'm working on a debugging tool that will allow me to get the environment
variables of a process on the same machine that the mcp is running on. I want to
pass an array of strings to grep processes on the machine. Using this example
below, I want to grep `node` and `mcp-weather` and return the process id of the
process that matches the strings.

<!-- markdownlint-disable MD013 -->

```sh
ps auxww | grep node | grep mcp-weather
lewis            23164   0.0  0.3 412869136  67040   ??  S     9:10a.m.   0:00.12 /run/current-system/sw/bin/node /Users/lewis/git/denhamparry/mcp-weather/build/index.js
```

<!-- markdownlint-enable MD013 -->

Once I have the process id, I want to get the environment variables of the
process.

<!-- markdownlint-disable MD013 -->

```sh
ps eww -p 23164
  PID   TT  STAT      TIME COMMAND
23164   ??  S      0:00.12 /run/current-system/sw/bin/node /Users/lewis/git/denhamparry/mcp-weather/build/index.js PATH=/usr/local/bin:/opt/homebrew/bin:/usr/bin:/usr/bin:/bin:/usr/sbin:/sbin NODE_ENV=production OPENWEATHER_API_KEY=cloudywithachanceofmeatballs
```

<!-- markdownlint-enable MD013 -->

I want to return the environment variables in a structured format.
