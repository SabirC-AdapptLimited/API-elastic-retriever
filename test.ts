import dotenv from "dotenv";

dotenv.config();

const APIkey = process.env.API_KEY;

const fetchContent = async () => {
  const healthResponse = await fetch("http://localhost:3000/healthcheck");

  if (!healthResponse.ok) {
    console.log("Server is down!");
  } else {
    console.log("Server is running");
  }

  const unauthorizedResponse = await fetch("http://localhost:3000/getContent", {
    headers: {
      Authorization: `Bearer ${"some random invalid key should cause to fail"}`,
    },
  });

  if (unauthorizedResponse.status === 401) {
    console.log(
      "Authorization is working properly test 1",
      await unauthorizedResponse.text()
    );
  } else {
    console.log("Authorization has failed test 1");
  }

  const unauthorizedWithoutBearerResponse = await fetch(
    "http://localhost:3000/getContent",
    {
      headers: {
        Authorization: `${APIkey}`,
      },
    }
  );

  if (unauthorizedWithoutBearerResponse.status === 401) {
    console.log(
      "Authorization is working properly test 2",
      await unauthorizedWithoutBearerResponse.text()
    );
  } else {
    console.log("Authorization has failed test 2");
  }

  const noDepartments = await fetch("http://localhost:3000/getContent", {
    headers: { Authorization: `Bearer ${APIkey}` },
  });

  if (noDepartments.status !== 401) {
    console.log("Authorization is working properly with correct api key");
  } else {
    console.log(
      "Authorization has failed with correct api key",
      noDepartments.status
    );
  }

  if (noDepartments.status === 400) {
    console.log(
      "Department param check is working properly",
      await noDepartments.text()
    );
  } else {
    console.log(
      "Something has failed in department param check",
      await noDepartments.text()
    );
  }

  console.log("\n\nValid test:\n");

  const response = await fetch(
    "http://localhost:3000/getContent?departments=someTag",
    {
      headers: { Authorization: `Bearer ${APIkey}` },
    }
  );
  console.log(response.status);
  console.log(await response.text());
};

fetchContent();
