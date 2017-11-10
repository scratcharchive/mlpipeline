The larinet service allows your computer to serve as a MountainLab processing server. It is also needed in order to run mlpipeline locally.

Instructions:

If you installed mlpipeline via package manager (e.g. apt install), then just do the following

> larinet --data_directory=/path/to/prvbucket

where /path/to/prvbucket is the directory where MLPipeline will store intermediate (and other) files.

Otherwise, if you are using mlpipeline from downloaded (or cloned) source code, do the following:

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

Currently, it will run on port 5005, but this port can be changed using the PORT environment variable. However, you will need to make sure that the client software knows to communicate with this port.

-------------------------------------------------------

Note: If this is for a processing server, accessible from the internet, then you should run it in something like tmux

> tmux new -s larinet
> npm start

	If running on a port other than 5005:
	> tmux new -s larinet
	> npm start (or if you installed as a package, run larinet as above)

Ctrl+b,d to close

Subsequently, to re-connect to the tmux session:

> tmux a -t larinet

tmux should stay alive even if you close your terminal (wow)
