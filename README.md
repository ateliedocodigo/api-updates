# Api Updates

Available on [GitHub Pages](https://ateliedocodigo.github.io/api-updates), **Api Updates** is an interface to monitor service version across environments.

Inspired on `swagger`, it uses a configuration url, that loads the services table.

![Default Table Loaded](https://github.com/ateliedocodigo/api-updates/raw/master/public/table-default.png "Default Table Loaded")

Each line is an api, with a name, staging url and production url.

By clicking on service link, it will fill the current cell with service content.

The `call` button will call both current row services.

The `call` button on header, will call all services.

After each call, result column will be filled with the comparision of staging and producion satus.

![Full called Table](https://github.com/ateliedocodigo/api-updates/raw/master/public/table-called.png "Full called Table")

| Result | Description |
| ------ | ------ |
| 0 | Staging or Production error |
| 1 | Content differ |
| 2 | Content is equal |

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.
