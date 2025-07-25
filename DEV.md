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

## Step 3 - find output strings in a node JS application

I want to create a server tool called
`luck_about_and_find_out_output_string_names` that will return to me a list of
the output strings from a node js file. The user will provide the file name and
the tool will return a list of strings that it can amend. The output string to
be returned should follow the format `$(variable_name)` within the code base.
For example, if the output string is `forecast`, the output should be
`$(forecast)`.

## Step 4 - rewrite a node JS application

I want to create a server tool called
`luck_about_and_find_out_replace_string_values` that will take a file name, an
output string name, and a value from the user. The tool will then modify the
file and set the string to the value provided by the user. The output string
would be in the format `$(variable_name)`, and the value would be the value to
be set. For example, if the output string is `$(forecast)` , and the value is
`10`, the tool will modify the file to set the variable to `10`.

## Step 5 - kill a process id

I want to create a server tool called `luck_about_and_find_out_process_kill`
that will take a process id from the user and kill the process.
