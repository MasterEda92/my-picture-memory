const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const path = require('path')

const template = 
[
  {
    label: 'View',
    submenu: 
    [
      {role: 'reload'},
      {role: 'forcereload'},
      {role: 'toggledevtools'},
      {type: 'separator'},
      {role: 'resetzoom'},
      {role: 'zoomin'},
      {role: 'zoomout'},
      {type: 'separator'},
      {role: 'togglefullscreen'}
    ]
  },
  {
    role: 'window',
    submenu: 
    [
      {role: 'minimize'},
      {role: 'close'}
    ]
  }
];

if (process.platform === 'darwin') 
{
  template.unshift(
    {
      label: app.getName(),
      submenu: 
      [
        {
          label: 'Über MyPictureMemory', click() 
          {
            dialog.showMessageBox(null, 
            {
              type: "info",
              title: "Über MyPictureMemory",
              message: "MyPictureMemory Version 1.0.0\nby Stefan Eder"
            });
          }
        },
        {type: 'separator'},
        {role: 'services', submenu: []},
        {type: 'separator'},
        {role: 'hide'},
        {role: 'hideothers'},
        {role: 'unhide'},
        {type: 'separator'},
        {role: 'quit'}
    ]
  })

  // Window menu
  template[2].submenu = 
  [
    {role: 'close'},
    {role: 'minimize'},
    {role: 'zoom'},
    {type: 'separator'},
    {role: 'front'}
  ]
}

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

let win;

function createWindow () 
{
  // create browser window
  win = new BrowserWindow(
  { width: 1000,
    height: 700, 
    show: false,
    icon: path.join(__dirname, 'assets', 'png', 'brains-icon.png'), 
    webPreferences: { nodeIntegration: true }
  });

  // load index.html
  win.loadFile(path.join (__dirname, 'src', 'index.html'));

  //win.webContents.openDevTools();

  win.on('closed', () => 
  {
    win = null;
  });

  win.once('ready-to-show', () => 
  {
    win.show();
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => 
{
  if (process.platform !== 'darwin') 
  {
    app.quit();
  }
});

app.on('activate', () => 
{
  if (win === null) 
  {
    createWindow();
  }
});

// shuffle array
function arrayShuffle ()
{
  let tmp, rand;
  for (let i = 0; i < this.length; ++i)
  {
      rand = Math.floor(Math.random () * this.length);
      tmp = this[i];
      this[i] = this[rand];
      this[rand] = tmp;
  }
}
Array.prototype.shuffle = arrayShuffle;

// select images from file system
function getImages ()
{
    const options =
    {
      title: "Bilder auswählen",
      filters: 
      [
        {name: 'Images', extensions: ['jpg', 'png', 'gif']},
        {name: 'All Files', extensions: ['*']}
      ],
      properties: ['openFile', 'multiSelections']
    };

    let Images1 = dialog.showOpenDialog (null, options);
    let Images2 = Images1.slice(); // duplicate images
    let Images = Images1.concat(Images2); // merge arrays
    Images.shuffle (); // shuffle images
    return Images;
}

// select images and send to renderer process
ipcMain.on('get-images', (event, arg) => 
{  
  var Images = getImages();
  if (Images !== undefined)
    event.reply ('get-images-reply', Images);
});

// quit app on click
ipcMain.on('quit-app', (event, arg) => 
{
  app.quit ();
})
