'use strict'

const { ipcRenderer } = require('electron')

// globals
let flipCardCounter = 0; // counter for flip cards
let arrRevealedIDs = []; // array for revealed Image-IDs
let countImages = 0; // count of selected images (duplicated)

// variables for clicked images
let IdFirstSelected = undefined;
let IdSecondSelected = undefined; 

// set display time default
$('#display-time').val(2000);

// sleep-function
const sleep = (milliseconds) => 
{
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

// create FlipCard-HTML
function createFlipCardHtml (value)
{
    ++flipCardCounter;
    let cardId = `card${flipCardCounter}`;

    // create HTML block
    var newElem = $(
    `<div class="mix col-sm-2 my-4 py-3">
        <div class="flip_card" id="${cardId}" my-4>
            <div class="front" my-4>
                <img src="../img/blank.png" width="100%" alt="img" class="img-thumbnail" id="img_f${cardId}" my-4>
            </div>
            <div class="back" my-4>
                <img src="${value}" alt="img" class="img-thumbnail" id="img_b${cardId}" my-4>
            </div>
        </div>
    </div>`);

    // insert HTML block
    $('#images_container').append(newElem);
}

// create flip cards from images array
function createFlipCards (Images)
{
    // delete flip cards and reset counter
    $('#images_container').children().remove();
    arrRevealedIDs.length = 0;
    flipCardCounter = 0;

    countImages = Images.length;

    // create new flip cards
    Images.forEach (createFlipCardHtml);

    // create actions
    $(".flip_card").flip(
    {
        trigger: 'manual'
    });

    // flip card click event
    $('.flip_card').click((e) => 
    {
        let ID = $('#' + e.target.id).parentsUntil('.flip_card').parent().attr('id');
        let ImgUrl = $(`#img_b${ID}`).attr('src');

        // catch click on revealed image
        if (ID === IdFirstSelected || arrRevealedIDs.includes (ID))
        {
            return;
        }

        if (IdFirstSelected === undefined) // first image selected
        {
            IdFirstSelected = ID;
            $('#' + ID).flip('toggle');    
        }
        else if (IdSecondSelected === undefined) // secend image selected
        {
            $('#' + ID).flip('toggle');

            sleep($('#display-time').val()).then(() => 
            { 
                IdSecondSelected = ID;
                let ImgUrlFirst = $(`#img_b${IdFirstSelected}`).attr('src');
                if (ImgUrlFirst === ImgUrl)
                {
                    // pair found
                    // remember IDs
                    arrRevealedIDs.push(IdFirstSelected);
                    arrRevealedIDs.push(IdSecondSelected);
                    // reset variables
                    IdFirstSelected = undefined;
                    IdSecondSelected = undefined;

                    // all images revealed?
                    if (arrRevealedIDs.length === countImages)
                    {
                        alert ('Gratulations! You solved the game!\nTo restart the game click the button "select images".');
                    }
                }
                else
                {
                    // pair not found
                    
                    // toggle image, reset variables and remember IDs
                    $('#' + IdFirstSelected).flip('toggle');
                    $('#' + IdSecondSelected).flip('toggle');
                    IdFirstSelected = undefined;
                    IdSecondSelected = undefined;
                }
            })
        }
        else // fatal error
        {
            alert('Fatal error! The app will be terminated!');
            ipcRenderer.send('quit-app');
        }
    })
}

// initialize functions and handlers
$(document).on('ready', function() 
{
    // get images on start
    ipcRenderer.send('get-images');

    // get images on click
    $('#btn-select-images').on('click', () => 
    {
        ipcRenderer.send('get-images');
    });

    // get images from main process
    ipcRenderer.on('get-images-reply', (event, arg) => 
    {
        createFlipCards(arg);
    });

    // quit app
    $('#btn-quit').on('click', () => 
    {
        ipcRenderer.send('quit-app');
    });
});



