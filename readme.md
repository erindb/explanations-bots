# bots

* why-bot: the automated 3-year-old
* goal-bot
* advice-bot

# nlp server

these bots (will) all use stanford core nlp tools

## setup:

* get access to a server with at least 3GB of ram and permissions for http requests (if you can use port 80 for this, the files should be set up correctly for you)

* ssh onto this server

        ssh username@server-address

* install some dependencies

        sudo apt-get install git python-pexpect python-unidecode

* download [dasmith's stanford-corenlp-python wrapper](https://github.com/dasmith/stanford-corenlp-python)

        git clone git://github.com/dasmith/stanford-corenlp-python.git

* download [stanford's core nlp tools](http://nlp.stanford.edu/software/corenlp.shtml) INSIDE the dasmith folder

        cd stanford-corenlp-python
        wget http://nlp.stanford.edu/software/stanford-corenlp-2012-07-09.tgz
        tar xvfz stanford-corenlp-2012-07-09.tgz

* start the python nlp wrapper server

        python corenlp.py

* get and run my intermediate server file (you might need to change the port in the second-to-last line)

        wget stanford.edu/~erindb/talk-to-js.py
        python talk-to-js.py

* change the host in the ajax request in the *bot.js file to the address of your server (or use mine if mine is set up)