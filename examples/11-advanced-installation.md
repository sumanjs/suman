
As many experienced Node.js and NPM users may know, global modules present several problems to developers.

<i>One of the biggest problems is that the global module version may differ from the local one.</i>

Furthermore, when using NVM and switching between Node.js versions, 
we may lose sight of globally installed packages which we may depend on.

One solution to this problem is to avoid installing packages globally altogether, and Suman is designed to handle this.

Simply add this line to your .bash_profile or .bashrc file (if you use zsh or something else, do something similar).

<span style="background-color:#FF8C00">&nbsp;``` alias suman = "TBD" ```</span>