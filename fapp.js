const mapData = {
    minX: 1,
    maxX: 14,
    minY: -1,
    maxY: 8
       
};
// Options for Player Colors... these are in the same order as our sprite sheet
/*tslint:disabled*/

//const name = prompt("Please Tell Us Your Name");
// const name = "Ian";

const playerColors = ["blue", "red", "orange", "yellow", "green", "purple"];
//Misc Helpers
function randomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getKeyString(x, y) {
    return `${x}x${y}`;
}

function createName() { // !!! change name
    return `${user.displayName}`;
}

function isSolid(x, y) {
    // const blockedNextSpace = mapData.blockedSpaces[getKeyString(x, y)];
    return (
        // blockedNextSpace ||
        x >= mapData.maxX ||
        x < mapData.minX ||
        y >= mapData.maxY ||
        y < mapData.minY
    )
}

function getRandomSafeSpot() { // !!! change to next seat
    //We don't look things up by key here, so just return an x/y
    return randomFromArray([
        { x: 4, y: 6 },
        { x: 4, y: 8 },
        { x: 4, y: 8 },
        { x: 4, y: 5 },
        { x: 6, y: 6 },
        { x: 6, y: 8 },
        { x: 6, y: 8 },
        { x: 6, y: 5 },
        { x: 8, y: 6 },
        { x: 8, y: 8 },
        { x: 8, y: 8 },
        { x: 8, y: 5 },
        { x: 9, y: 6 },
        { x: 9, y: 8 },
        { x: 9, y: 8 },
        { x: 9, y: 5 },
    ]);
}




(function() {

    let playerId;
    let playerRef;
    //where players are on the map
    let players = {};
    //dom elements for each player
    let playerElements = {};

    const gameContainer = document.querySelector(".focus-game-container");
    const playerNameInput = document.querySelector("#player-name");
    const playerColorButton = document.querySelector("#player-color");



    function handleArrowPress(xChange = 0, yChange = 0) {
        const newX = players[playerId].x + xChange;
        const newY = players[playerId].y + yChange;
        console.log("newX", newX, "newY", newY);
        if (!isSolid(newX, newY)) {
            // if (true) {
            //move to the next space
            players[playerId].x = newX;
            players[playerId].y = newY;
            if (xChange === 1) {
                players[playerId].direction = "right";
            }
            if (xChange === -1) {
                players[playerId].direction = "left";
            }
            playerRef.set(players[playerId]);
        }
    }

    function initGame() {

        new KeyPressListener("ArrowUp", () => handleArrowPress(0, -1))
        new KeyPressListener("ArrowDown", () => handleArrowPress(0, 1))
        new KeyPressListener("ArrowLeft", () => handleArrowPress(-1, 0))
        new KeyPressListener("ArrowRight", () => handleArrowPress(1, 0))

        const allPlayersRef = firebase.database().ref(`players`);


        allPlayersRef.on("value", (snapshot) => {
            //Fires whenever a change occurs
            players = snapshot.val() || {};
            Object.keys(players).forEach((key) => {
                const characterState = players[key];
                let el = playerElements[key];
                // Now update the DOM
                el.querySelector(".Character_name").innerText = characterState.name;
                el.setAttribute("data-color", characterState.color);
                el.setAttribute("data-direction", characterState.direction);
                const left = 16 * characterState.x + "px";
                const top = 16 * characterState.y - 4 + "px";
                el.style.transform = `translate3d(${left}, ${top}, 0)`;
            })
        })
        allPlayersRef.on("child_added", (snapshot) => {
            //Fires whenever a new node is added the tree
            const addedPlayer = snapshot.val();
            const characterElement = document.createElement("div");
            characterElement.classList.add("Character", "grid-cell");
            if (addedPlayer.id === playerId) {
                characterElement.classList.add("you");
            }
            characterElement.innerHTML = (`
        <div class="Character_shadow grid-cell"></div>
        <div class="Character_sprite grid-cell"></div>
        <div class="Character_name-container">
          <span class="Character_name"></span>
        </div>
        <div class="Character_you-arrow"></div>
      `);
            playerElements[addedPlayer.id] = characterElement;

            //Fill in some initial state
            characterElement.querySelector(".Character_name").innerText = addedPlayer.name;
            characterElement.setAttribute("data-color", addedPlayer.color);
            characterElement.setAttribute("data-direction", addedPlayer.direction);
            const left = 16 * addedPlayer.x + "px";
            const top = 16 * addedPlayer.y - 4 + "px";
            characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
            gameContainer.appendChild(characterElement);
        })

        //Remove character DOM element after they leave
        allPlayersRef.on("child_removed", (snapshot) => {
            const removedKey = snapshot.val().id;
            gameContainer.removeChild(playerElements[removedKey]);
            delete playerElements[removedKey];
        })



        //Updates player name with text input
        playerNameInput.addEventListener("change", (e) => {
            const newName = e.target.value || createName();
            playerNameInput.value = newName;
            playerRef.update({
                name: newName
            })
        })

        //Update player color on button click
        playerColorButton.addEventListener("click", () => {
            const mySkinIndex = playerColors.indexOf(players[playerId].color);
            const nextColor = playerColors[mySkinIndex + 1] || playerColors[0];
            playerRef.update({
                color: nextColor
            })
        })

        //Place my first coin

    }

    firebase.auth().onAuthStateChanged((user) => {
        console.log(user)
        if (user) {
            //You're logged in!
            playerId = user.uid;
            playerRef = firebase.database().ref(`players/${playerId}`);


            playerNameInput.value = user.displayName;

            const { x, y } = getRandomSafeSpot();


            playerRef.set({
                id: playerId,
                name: user.displayName,
                direction: "right",
                color: randomFromArray(playerColors),
                x,
                y,
                //coins: 0,
            })

            //Remove me from Firebase when I diconnect
            playerRef.onDisconnect().remove();

            //Begin the game now that we are signed in
            initGame();
        } else {
            //You're logged out.
        }
    })

    firebase.auth().signInAnonymously().catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        // ...
        console.log(errorCode, errorMessage);
    });


})();
