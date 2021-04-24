SELECT * FROM accounts;
DELETE FROM accounts;
DROP TABLE IF EXISTS accounts;

CREATE TABLE accounts (
    username VARCHAR(15),
    password VARCHAR(25)
)

SELECT * FROM leaderboard;
DELETE FROM leaderboard;
DROP TABLE IF EXISTS leaderboard;

CREATE TABLE leaderboard (
    username VARCHAR(15),
    kills INT(255),
    waves_survived INT(255),
    highest_wave INT(255),
    best_time VARCHAR(10)
)