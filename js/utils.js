class NetworkError extends Error {
  constructor(msg, response) {
    super(msg);
    this.name = "NetworkError";
    this.response = response;
    this.status = response.status;
    this.statusText = response.statusText;
  }
}

class WebError extends Error {
  constructor(msg) {
    super(msg);
    this.name = "WebError";
  }
}

function delay(timmy = 2000) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, timmy);
  });
}

export { NetworkError, delay, WebError };

/*
  Sample usage of custom NetworkError
  
  fetch(url)
    .then(response => {
      if( ! response.ok ) throw new NetworkError('Failed API Call', response);
      return response.json();
    })
    .then(data => {
      //you have the json data to use
    })
    .catch(err=>{
      //handle the error and tell the user
    });
  */
