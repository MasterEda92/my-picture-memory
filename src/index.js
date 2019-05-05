'use strict'

const { ipcRenderer } = require('electron')

// Globals
let FlipCardCounter = 0; // Counter der für die Erzeugung der IDs benutzt wird
let arrAufgedeckteIDs = []; // Array für Aufgedeckte Image-IDs
let anzImages = 0; // Anzahl der ausgewählten Bilder (dupliziert)
// Variablen für ausgewählte/geklickte Images
let IdFirstSelected = undefined;
let IdSecondSelected = undefined; 

// Sleep-Funktion
const sleep = (milliseconds) => 
{
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

// FlipCard-HTML erstellen
function createFlipCardHtml (value)
{
    ++FlipCardCounter;
    let cardId = `card${FlipCardCounter}`;

    // HTML-Baustein erzeugen
    var newElem = $(
    `<div class="mix col-sm-3 my-4 py-3">
        <div class="flip_card" id="${cardId}" my-4>
            <div class="front" my-4>
                <img src="../img/blank.png" width="100%" alt="img" class="img-thumbnail" id="img_f${cardId}" my-4>
            </div>
            <div class="back"my-4>
                <img src="${value}" alt="img" class="img-thumbnail" id="img_b${cardId}" my-4>
            </div>
        </div>
    </div>`);

    // HTML-Baustein einfügen
    $('#bilder_container').append(newElem);
}

// FlipCards erstellen und alles was dazu gehört
function createFlipCards (Images)
{
    // Alle bestehenden FlipCards (Map ebenfalls) löschen und Counter zurücksetzen
    $('#bilder_container').children().remove();
    arrAufgedeckteIDs.length = 0;
    FlipCardCounter = 0;

    anzImages = Images.length;

    // neue FlipCards anlegen
    Images.forEach (createFlipCardHtml);

    // Aktionen neu erstellen
    $(".flip_card").flip(
    {
        trigger: 'manual'
    });

    // Click auf FlipCard behandeln 
    $('.flip_card').click((e) => 
    {
        let ID = $('#' + e.target.id).parentsUntil('.flip_card').parent().attr('id');
        let ImgUrl = $(`#img_b${ID}`).attr('src');

        // Click auf aufgedecktes/aufgelöstes Image abfangen
        if (ID === IdFirstSelected || arrAufgedeckteIDs.includes (ID))
        {
            return;
        }

        if (IdFirstSelected === undefined) // erstes Image auswählen
        {
            IdFirstSelected = ID;
            $('#' + ID).flip('toggle');    
        }
        else if (IdSecondSelected === undefined) // zweites Image auswählen
        {
            $('#' + ID).flip('toggle');

            // 1 Sekunde warten bevor weiter gemacht wird
            sleep(1000).then(() => 
            { 
                IdSecondSelected = ID;
                let ImgUrlFirst = $(`#img_b${IdFirstSelected}`).attr('src');
                if (ImgUrlFirst === ImgUrl)
                {
                    // Paar gefunden
                    // IDs merken
                    arrAufgedeckteIDs.push(IdFirstSelected);
                    arrAufgedeckteIDs.push(IdSecondSelected);
                    // Variablen zurücksetzen und nicht zurücktogglen
                    IdFirstSelected = undefined;
                    IdSecondSelected = undefined;

                    // alle gelöst?
                    if (arrAufgedeckteIDs.length === anzImages)
                    {
                        alert ('Glückwunsch! Sie haben das Spiel gelöst!\nUm ein neues Spiel zu starten klicken Sie einfach auf "Bilder auswählen".');
                    }
                }
                else
                {
                    // Paar nicht gefunden
                    
                    // Bilder zurücktogglen, Variablen rücksetzen und IDs merken
                    $('#' + IdFirstSelected).flip('toggle');
                    $('#' + IdSecondSelected).flip('toggle');
                    IdFirstSelected = undefined;
                    IdSecondSelected = undefined;
                }
            })
        }
        else // Irgendwas ist schief gelaufen!
        {
            alert('Fehler aufgetreten! Das Programm wird beendet!');
            ipcRenderer.send('quit-app');
        }
    })
}

// Funktionen und Handler initialisieren
$(document).on('ready', function() 
{
    // bei Programmstart Bilder abfragen
    ipcRenderer.send('get-images');

    // beim Button-Click Bilder abfragen
    $('#btn-select-images').on('click', () => 
    {
        ipcRenderer.send('get-images');
    });

    // Bilder vom Hauptprozess übernehmen
    ipcRenderer.on('get-images-reply', (event, arg) => 
    {
        createFlipCards(arg);
    });

    // App beenden
    $('#btn-quit').on('click', () => 
    {
        ipcRenderer.send('quit-app');
    });
});



