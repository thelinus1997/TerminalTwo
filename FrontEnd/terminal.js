const { Select, Input, Password } = require("enquirer");
const axios = require("axios");
const readline = require("readline");

const baseUrl = "http://localhost:3000";

(async () => {
  const prompt = new Select({
    name: "choice",
    message: "Choose an option:",
    choices: [
      { name: "login", message: "Login" },
      { name: "register", message: "Register" },
    ],
  });

  try {
    const choice = await prompt.run();

    if (choice === "login") {
      await login();
    } else if (choice === "register") {
      await register();
    }
  } catch (err) {
    console.error("An error occurred:", err);
  }
})();

//Main menu method, after user completes tasks this is where they will return. Allows the user to either list events or register/unregister to them.
async function main(token) {
  console.log("Successfully logged in.");

  const mainMenu = new Select({
    name: "mainChoice",
    message: "What would you like to do?",
    choices: [
      { name: "listEvents", message: "List Events" },
      { name: "eventRegistry", message: "Event Registry" },
    ],
  });

  try {
    const mainChoice = await mainMenu.run();

    if (mainChoice === "listEvents") {
      await listEvents(token);
    } else if (mainChoice === "eventRegistry") {
      await eventRegistry(token);
    }
  } catch (err) {
    console.error("An error occurred in the main menu:", err);
  }
}

//Validates input so its never empty
const validateInput = (value) => {
  return value && value.trim().length > 0
    ? true
    : "This field cannot be empty. Please enter at least 1 character.";
};
//Logs the user in and passes on the token.
const login = async () => {
  try {
    const usernamePrompt = new Input({
      name: "username",
      message: "Enter your username:",
      validate: validateInput,
    });
    const username = await usernamePrompt.run();

    const passwordPrompt = new Password({
      name: "password",
      message: "Enter your password:",
      mask: "*",
      validate: validateInput,
    });
    const password = await passwordPrompt.run();
    try {
      const response = await axios.post(`${baseUrl}/api/users/login`, {
        username: username,
        password: password,
      });
      main(response.data.token);
    } catch (err) {
      console.error("An error occurred during login:", err);
    }
  } catch (err) {
    console.error("An error occurred during login:", err);
  }
};
//Creates a user in the database that then can be used to log in.
const register = async () => {
  try {
    const usernamePrompt = new Input({
      name: "username",
      message: "Enter your username:",
      validate: validateInput,
    });
    const username = await usernamePrompt.run();

    const firstNamePrompt = new Input({
      name: "firstName",
      message: "Enter your first name:",
      validate: validateInput,
    });
    const firstName = await firstNamePrompt.run();

    const lastNamePrompt = new Input({
      name: "lastName",
      message: "Enter your last name:",
      validate: validateInput,
    });
    const lastName = await lastNamePrompt.run();

    const passwordPrompt = new Password({
      name: "password",
      message: "Enter your password:",
      mask: "*",
      validate: validateInput,
    });
    const password = await passwordPrompt.run();

    try {
      const response = await axios.post(`${baseUrl}/api/users/register`, {
        username: username,
        firstName: firstName,
        lastName: lastName,
        password: password,
      });
      console.log(response);
      if (response.status === 201) {
        //If the registry is successful: go to login
        login();
      }
    } catch (err) {
      console.error("An error occurred during registration:", err);
    }
  } catch (err) {
    console.error("An error occurred during registration:", err);
  }
};
//Lists all events and creates an enquirer select list with each event included.
async function listEvents(token, registry) {
  try {
    const response = await axios.get(`${baseUrl}/api/events`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.data || response.data.length === 0) {
      console.log("No events found... Returning to menu");
      main(token);
    }
    const eventList = response.data.map((e, index) => ({
      name: e.id,
      message: e.title,
    }));
    const eventMenu = new Select({
      name: "selectedEvent",
      message: "Select an event to see more info",
      choices: eventList,
    });
    if (!registry) {
      const selectedEvent = await eventMenu.run();
      console.log(`You selected: ${selectedEvent}`);

      fetchFullData(response.data, selectedEvent, token);
    }
    if (registry) {
      console.log("Event registry...");
      const selectedEvent = await eventMenu.run();
      console.log(selectedEvent);
      return selectedEvent;
    }
  } catch (err) {
    console.error("Error fetching all events", err);
  }
}
//Simply prints out all data on a specific event.
function fetchFullData(data, eventId, token) {
  const selectedEvent = data.find((e) => e.id === eventId);

  if (!selectedEvent) {
    console.error("Selected event not found!");
    return;
  }

  const { title, date, location, description, participants } = selectedEvent;

  console.log("=== Event Details ===");
  console.log(`Title: ${title}`);
  console.log(`Date: ${new Date(date).toLocaleDateString()}`);
  console.log(`Location: ${location?.name || "Location not specified"}`);
  console.log(`Description: ${description}`);
  console.log("\n=== Participants ===");

  if (participants && participants.length > 0) {
    participants.forEach((participant, index) => {
      console.log(
        `${index + 1}. ${participant.firstName} ${participant.lastName}`
      );
    });
    console.log("\nPress any key to return to the main menu...");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.on("line", () => {
      rl.close();
      main(token);
    });
  } else {
    console.log("No participants registered.");
    console.log("\nPress any key to return to the main menu...");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.on("line", () => {
      rl.close();
      main(token);
    });
  }
}

//Another menu similiar to main.
async function eventRegistry(token) {
  const registryChoice = new Select({
    name: "registryChoice",
    message: "Do you want to register or unregister from an event?",
    choices: [
      { name: "register", message: "Register to an event" },
      { name: "unregister", message: "Unregister from an event" },
    ],
  });

  try {
    const choice = await registryChoice.run();

    if (choice === "register") {
      await registerToEvent(token);
    } else if (choice === "unregister") {
      await unregisterFromEvent(token);
    }
  } catch (err) {
    console.error("An error occurred in eventRegistry:", err);
  }
}
//Reuses listEvents to choose which event to register to. Simply sends token which is decoded in the backend to determine the user.
async function registerToEvent(token) {
  const chosenEvent = await listEvents(token, true);
  console.log(chosenEvent);
  try {
    const response = await axios.post(
      `${baseUrl}/api/events/${chosenEvent}/request-participation`,
      { token },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("Registry successful, returning to menu...");
    main(token);
  } catch (err) {
    console.error("ERROR REGISTERING TO EVENT: ", err.response.data);
    main(token);
  }
}
//Reuses listEvents to choose which event to unregister from. Simply sends token be decoded in the backend to determine the user. If you select an event youre not registered to it tells you this and prompts you to choose again.
async function unregisterFromEvent(token) {
  const chosenEvent = await listEvents(token, true);
  console.log(chosenEvent);
  try {
    const response = await axios.delete(
      `${baseUrl}/api/events/${chosenEvent}/cancel`,
      {
        data: { token },
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("Successfully unregistered, returning to menu...");
    main(token);
  } catch (err) {
    console.error("Error unregistering, ", err.response.data);
    unregisterFromEvent(token);
  }
}
