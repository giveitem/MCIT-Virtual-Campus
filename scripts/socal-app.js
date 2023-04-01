/// Authentication
const auth = firebase.auth();
const whenSignedIn = document.getElementById('whenSignedIn');
const whenSignedOut = document.getElementById('whenSignedOut');
const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const userDetails = document.getElementById('userDetails');
const provider = new firebase.auth.GoogleAuthProvider();

/// Sign in event handlers
signInBtn.onclick = () => auth.signInWithPopup(provider);
signOutBtn.onclick = () => auth.signOut();

/// When signed in or signed out
auth.onAuthStateChanged(user => {
    if (user) {

        whenSignedIn.hidden = false;
        whenSignedOut.hidden = true;


        // chat
        const db = firebase.database();
        document.getElementById("message-form").addEventListener("submit", sendMessage);
        const fetchChat = db.ref("messages/");
        const username = user.displayName;

        function sendMessage(e) {
            e.preventDefault();
            // get values to be submitted
            const timestamp = Date.now();
            const messageInput = document.getElementById("message-input");
            const message = messageInput.value;
            // clear the input box
            messageInput.value = "";
            //auto scroll to bottom
            document
                .getElementById("messages")
                .scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
            // create db collection and send in the data
            db.ref("messages/" + timestamp).set({
                username,
                message,
            });
        }
        fetchChat.on("child_added", function (snapshot) {
            const messages = snapshot.val();
            const message = `<li class=${username === messages.username ? "sent" : "receive"
                }><span>${messages.username}: </span>${messages.message}</li>`;
            // append the message on the page
            document.getElementById("messages").innerHTML += message;
        });

        initGame();

    } else {
        // not signed in
        whenSignedIn.hidden = true;
        whenSignedOut.hidden = false;
        userDetails.innerHTML = '';
    }
});


const mapData = {
    minX: 1,
    maxX: 14,
    minY: 1,
    maxY: 14
};

const playerColors = ["blue", "red", "orange", "yellow", "green", "purple"];

//Misc Helpers
function randomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getKeyString(x, y) {
    return `${x}x${y}`;
}

function createName() { // !!! change name
    const prefix = randomFromArray([
        "NAME"
    ]);
    const animal = randomFromArray([
        "CLASS"
    ]);
    return `${prefix} ${animal}`;
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
        { x: 4, y: 10 },
        { x: 4, y: 5 },
        { x: 6, y: 6 },
        { x: 6, y: 8 },
        { x: 6, y: 10 },
        { x: 6, y: 5 },
        { x: 8, y: 6 },
        { x: 8, y: 8 },
        { x: 8, y: 10 },
        { x: 8, y: 5 },
        { x: 9, y: 6 },
        { x: 9, y: 8 },
        { x: 9, y: 10 },
        { x: 9, y: 5 },
    ]);
}

(function () {
    let playerId;
    let playerRef;
    //where players are on the map
    let players = {};
    //dom elements for each player
    let playerElements = {};

    const gameContainer = document.querySelector(".social-game-container");
    const playerNameInput = document.querySelector("#player-name");
    const playerColorButton = document.querySelector("#player-color");

    function handleArrowPress(xChange = 0, yChange = 0) {
        const newX = players[playerId].x + xChange;
        const newY = players[playerId].y + yChange;
        if (!isSolid(newX, newY)) {
            console.log("newX", newX, "newY", newY);
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
            if (players[playerId].x === 12 && players[playerId].y === 11) {
                const videoElement = document.createElement("div");
                videoElement.classList.add("video");
                videoElement.innerHTML = `<iframe width="100" height="100" src="https://www.youtube.com/embed/OjNpRbNdR7E?&autoplay=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
                gameContainer.appendChild(videoElement);
            } else {
                const videoElement = document.querySelector(".video");
                if (videoElement) {
                    videoElement.remove();
                }
            }
        }
    }

    function initGame() {

        new KeyPressListener("ArrowUp", () => handleArrowPress(0, -1))
        new KeyPressListener("ArrowDown", () => handleArrowPress(0, 1))
        new KeyPressListener("ArrowLeft", () => handleArrowPress(-1, 0))
        new KeyPressListener("ArrowRight", () => handleArrowPress(1, 0))

        const allPlayersRef = firebase.database().ref(`players`);
        // const name = user.displayName;

        allPlayersRef.on("value", (snapshot) => {
            //Fires whenever a change occurs
            players = snapshot.val() || {};
            Object.keys(players).forEach((key) => {
                const characterState = players[key];
                let el = playerElements[key];
                // console.log("plyaerelement:", playerElements);
                // console.log("key", key);
                // console.log("playerElements[key]", playerElements[key]);
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

    }

    firebase.auth().onAuthStateChanged((user) => {
        console.log(user)
        if (user) {
            //You're logged in!
            console.log("logged in");
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
            })

            //Remove from Firebase when disconnect
            playerRef.onDisconnect().remove();

            //Begin the game
            initGame();
        } else {
            //You're logged out.
        }
    })



})();