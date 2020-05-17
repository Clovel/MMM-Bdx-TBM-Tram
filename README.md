# MagicMirror module - Tramways TBM @ Bordeaux, France

## Installation
1. Navigate to your MagicMirror's modules folder, and run the following command: `git clone https://github.com/Clovel/MMM-Bdx-TBM-Tram.git`
2. Add the module and a valid configuration to your `config/config.js` file

## Using the module

This is an example configuration for your `config/config.js` file:
```js
var config = {
    modules: [
        {
            module: "MMM-Bdx-TBM-Tram",
            position: "middle_center",
            config: {
                records: 5,
                modus: "upcoming",
                showExtraInfo: false,
		        showColumnHeader: true,
	        }
	    },
    ]
}
```

## Configuration options

| Option            | Description
|-------------------|--------------------------------------------
| `records`         | *Optional* - The number of lines you want to show <br>*Default:* 5
| `modus`           | *Optional* - 'past' for past events, 'upcoming' for future events <br>*Default:* past
| `showExtraInfo`   | *Optional* - Do you want to show the launchsite (true) or not (false) <br>*Default:* false
| `showColumnHeader`| *Optional* - Choose if you want to see columnheadings <br>*Default:* false
