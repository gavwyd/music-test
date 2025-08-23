/* style.css */

body {
  font-family: Arial, sans-serif;
  background-color: #f4f4f4;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

header {
  background-color: #333;
  color: #fff;
  width: 100%;
  padding: 20px 0;
  text-align: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}

.container {
  width: 90%;
  max-width: 800px;
  background-color: #fff;
  margin: 20px 0;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.login-container {
  width: 300px;
  margin-top: 100px;
  background-color: #fff;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-container input, .login-container button {
  width: 90%;
  margin: 10px 0;
  padding: 10px;
  font-size: 16px;
}

.review-input form, .review-list {
  display: flex;
  flex-direction: column;
}

.review-input form input, .review-input form textarea, .review-input form button,
#search, #sort {
  margin: 10px 0;
  padding: 10px;
  font-size: 16px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.review-input form button {
  background-color: #4db8ff;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  border: none;
}

.review {
  border-bottom: 1px solid #ddd;
  padding: 10px 0;
}

.review:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  align-items: center;
}

.album-art {
  max-width: 100px;
  border-radius: 5px;
  margin-right: 15px;
}

.review-info h3 {
  margin: 0;
  font-size: 18px;
}

.review-info p {
  margin: 5px 0 0 0;
}

#search, #sort {
  width: 100%;
}

#reviews button {
  background-color: #ff4d4d;
  color: #fff;
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 5px;
}
