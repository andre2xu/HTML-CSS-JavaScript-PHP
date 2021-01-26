<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="styles.css">
    <title>MongoDB Practice</title>
</head>
<body>
    <main>
        <div class="form-box">
            <h1>Login Form</h1>
            <form action="/user/login" method="POST">
                <label for="username">Username</label>
                <div class="f-alert"><%= message1 %></div>
                <input type="text" placeholder="Username" name="username">
                <label for="password">Password</label>
                <div class="f-alert"><%= message2 %></div>
                <input type="password" placeholder="Password" name="password">
                <button type="submit">Login</button>
            </form>
        </div>
    
        <div class="form-box">
            <h1>Register Form</h1>
            <form action="/user/register" method="POST">
                <label for="username">Username</label>
                <div class="f-alert"><%= message %></div>
                <input type="text" placeholder="Username" name="username">
                <label for="password">Password</label>
                <input type="password" placeholder="Password" name="password">
                <button type="submit">Create account</button>
            </form>
        </div>
    </main>
</body>
</html>
