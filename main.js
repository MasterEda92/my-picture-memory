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

// Behalten Sie eine globale Referenz auf das Fensterobjekt. 
// Wenn Sie dies nicht tun, wird das Fenster automatisch geschlossen, 
// sobald das Objekt dem JavaScript-Garbagekollektor übergeben wird.

let win;

function createWindow () 
{
  // Erstellen des Browser-Fensters.
  win = new BrowserWindow(
  { width: 1000,
    height: 700, 
    show: false,
    icon: path.join(__dirname, 'assets', 'png', 'brains-icon.png'), 
    webPreferences: { nodeIntegration: true }
  });

  // und Laden der index.html der App.
  win.loadFile(path.join (__dirname, 'src', 'index.html'));

  // Öffnen der DevTools.
  //win.webContents.openDevTools();

  // Ausgegeben, wenn das Fenster geschlossen wird.
  win.on('closed', () => 
  {
    // Dereferenzieren des Fensterobjekts, normalerweise würden Sie Fenster
    // in einem Array speichern, falls Ihre App mehrere Fenster unterstützt. 
    // Das ist der Zeitpunkt, an dem Sie das zugehörige Element löschen sollten.
    win = null;
  });

  // Fenster anzeigen wenn bereit
  win.once('ready-to-show', () => 
  {
    win.show();
  });
}

// Diese Methode wird aufgerufen, wenn Electron mit der
// Initialisierung fertig ist und Browserfenster erschaffen kann.
// Einige APIs können nur nach dem Auftreten dieses Events genutzt werden.
app.on('ready', createWindow);

// Verlassen, wenn alle Fenster geschlossen sind.
app.on('window-all-closed', () => 
{
  // Unter macOS ist es üblich, für Apps und ihre Menu Bar
  // aktiv zu bleiben, bis der Nutzer explizit mit Cmd + Q die App beendet.
  if (process.platform !== 'darwin') 
  {
    app.quit();
  }
});

app.on('activate', () => 
{
  // Unter macOS ist es üblich ein neues Fenster der App zu erstellen, wenn
  // das Dock Icon angeklickt wird und keine anderen Fenster offen sind.
  if (win === null) 
  {
    createWindow();
  }
});

// In dieser Datei können Sie den Rest des App-spezifischen 
// Hauptprozess-Codes einbinden. Sie können den Code auch 
// auf mehrere Dateien aufteilen und diese hier einbinden.

// Elemente des Arrays durchmischen
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

// Bilder ermitteln
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
    let Images2 = Images1.slice(); // Bilder duplizieren da wir ja immer 2 davon brauchen
    let Images = Images1.concat(Images2); // Arrays zusammenfügen
    Images.shuffle (); // Elemente des Arrays durchmischen
    return Images;
}

// Bilder auswählen und an Renderer-Prozess schicken
ipcMain.on('get-images', (event, arg) => 
{  
  var Images = getImages();
  if (Images !== undefined)
    event.reply ('get-images-reply', Images);
});

// App beenden
ipcMain.on('quit-app', (event, arg) => 
{
  app.quit ();
})