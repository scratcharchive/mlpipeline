The larinet service allows your computer to serve as a MountainLab processing server. It is also needed in order to run mlpipeline locally.

Instructions:


-------------------------------------------------------
1. Configure larinet

> cp example.larinet.user.json larinet.user.json

Edit larinet.user.json to point to a prvbucket data directory on your computer.
MLPipeline will look for raw data and store intermediate (and other) files there.


-------------------------------------------------------
2. Install the nodejs dependencies

> npm install


-------------------------------------------------------
3. Run the service (and keep the terminal alive)

> npm start

Currently, it will run on port 5005. In the future that will be configurable. How near future? Depends on when somebody contacts me with that request.


-------------------------------------------------------

Note: If this is for a processing server, accessible from the internet, then you should run it in something like tmux

> tmux new -s larinet
> npm start

Ctrl+b,d to close

Subsequently, to re-connect to the tmux session:

> tmux a -t larinet

tmux should stay alive even if you close your terminal (wow)

