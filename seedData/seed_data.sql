-- CoogMusic Comprehensive Seed Data
-- This script populates the database with realistic dummy data
-- Based on schema.sqlite.sql and SEED_DATA_SUMMARY.md requirements

-- Insert Admin Users (UserIDs 1-4)
INSERT INTO userprofile (Username, UserPassword, FirstName, LastName, DateOfBirth, Email, UserType, DateJoined, Country, City, IsOnline, AccountStatus) VALUES
('admin_armaan', '$2b$10$hash1', 'Armaan', 'Amatya', '2000-01-01', 'aamatya5@cougarnet.uh.edu', 'Administrator', '2020-01-01', 'United States', 'Houston', 1, 'Active'),
('admin_josh', '$2b$10$hash2', 'Josh', 'Regner', '2003-04-28', 'jkregner@cougarnet.uh.edu', 'Administrator', '2020-01-01', 'United States', 'Houston', 1, 'Active'),
('admin_maick', '$2b$10$hash3', 'Maick', 'Ibassa', '2000-01-01', 'miibassa@cougarnet.uh.edu', 'Developer', '2020-01-01', 'United States', 'Houston', 1, 'Active'),
('admin_jordan', '$2b$10$hash4', 'Jordan', 'Kittley', '2000-01-01', 'jjkittle@cougarnet.uh.edu', 'Developer', '2020-01-01', 'United States', 'Houston', 1, 'Active');

-- Insert Artists (UserIDs 5-35) - 31 artists
INSERT INTO userprofile (Username, UserPassword, FirstName, LastName, DateOfBirth, Email, UserType, DateJoined, Country, City, IsOnline, AccountStatus) VALUES
-- Active Artists
('taylor_swift', '$2b$10$hash5', 'Taylor', 'Swift', '1989-12-13', 'taylor@swift.com', 'Artist', '2020-02-01', 'United States', 'Nashville', 1, 'Active'),
('ed_sheeran', '$2b$10$hash6', 'Ed', 'Sheeran', '1991-02-17', 'ed@sheeran.com', 'Artist', '2020-02-15', 'United Kingdom', 'Halifax', 1, 'Active'),
('billie_eilish', '$2b$10$hash7', 'Billie', 'Eilish', '2001-12-18', 'billie@eilish.com', 'Artist', '2020-03-01', 'United States', 'Los Angeles', 1, 'Active'),
('the_weeknd', '$2b$10$hash8', 'Abel', 'Tesfaye', '1990-02-16', 'abel@weeknd.com', 'Artist', '2020-03-15', 'Canada', 'Toronto', 1, 'Active'),
('ariana_grande', '$2b$10$hash9', 'Ariana', 'Grande', '1993-06-26', 'ariana@grande.com', 'Artist', '2020-04-01', 'United States', 'Boca Raton', 1, 'Active'),
('drake', '$2b$10$hash10', 'Aubrey', 'Graham', '1986-10-24', 'aubrey@drake.com', 'Artist', '2020-04-15', 'Canada', 'Toronto', 1, 'Active'),
('beyonce', '$2b$10$hash11', 'Beyoncé', 'Knowles', '1981-09-04', 'beyonce@knowles.com', 'Artist', '2020-05-01', 'United States', 'Houston', 1, 'Active'),
('kendrick_lamar', '$2b$10$hash12', 'Kendrick', 'Lamar', '1987-06-17', 'kendrick@lamar.com', 'Artist', '2020-05-15', 'United States', 'Compton', 1, 'Active'),
('lorde', '$2b$10$hash13', 'Ella', 'Yelich-OConnor', '1996-11-07', 'ella@lorde.com', 'Artist', '2020-06-01', 'New Zealand', 'Auckland', 1, 'Active'),
('frank_ocean', '$2b$10$hash14', 'Christopher', 'Breaux', '1987-10-28', 'chris@ocean.com', 'Artist', '2020-06-15', 'United States', 'Long Beach', 1, 'Active'),
('adele', '$2b$10$hash15', 'Adele', 'Adkins', '1988-05-05', 'adele@adkins.com', 'Artist', '2020-07-01', 'United Kingdom', 'London', 1, 'Active'),
('bruno_mars', '$2b$10$hash16', 'Peter', 'Hernandez', '1985-10-08', 'peter@mars.com', 'Artist', '2020-07-15', 'United States', 'Honolulu', 1, 'Active'),
('dua_lipa', '$2b$10$hash17', 'Dua', 'Lipa', '1995-08-22', 'dua@lipa.com', 'Artist', '2020-08-01', 'United Kingdom', 'London', 1, 'Active'),
('harry_styles', '$2b$10$hash18', 'Harry', 'Styles', '1994-02-01', 'harry@styles.com', 'Artist', '2020-08-15', 'United Kingdom', 'Holmes Chapel', 1, 'Active'),
('olivia_rodrigo', '$2b$10$hash19', 'Olivia', 'Rodrigo', '2003-02-20', 'olivia@rodrigo.com', 'Artist', '2020-09-01', 'United States', 'Temecula', 1, 'Active'),
('the_beatles', '$2b$10$hash20', 'John', 'Lennon', '1940-10-09', 'john@beatles.com', 'Artist', '2020-09-15', 'United Kingdom', 'Liverpool', 0, 'Active'),
('queen', '$2b$10$hash21', 'Freddie', 'Mercury', '1946-09-05', 'freddie@queen.com', 'Artist', '2020-10-01', 'United Kingdom', 'London', 0, 'Active'),
('led_zeppelin', '$2b$10$hash22', 'Robert', 'Plant', '1948-08-20', 'robert@zeppelin.com', 'Artist', '2020-10-15', 'United Kingdom', 'West Bromwich', 0, 'Active'),
('pink_floyd', '$2b$10$hash23', 'Roger', 'Waters', '1943-09-06', 'roger@floyd.com', 'Artist', '2020-11-01', 'United Kingdom', 'Cambridge', 0, 'Active'),
('nirvana', '$2b$10$hash24', 'Kurt', 'Cobain', '1967-02-20', 'kurt@nirvana.com', 'Artist', '2020-11-15', 'United States', 'Aberdeen', 0, 'Active'),
('metallica', '$2b$10$hash25', 'James', 'Hetfield', '1963-08-03', 'james@metallica.com', 'Artist', '2020-12-01', 'United States', 'Los Angeles', 1, 'Active'),
('skrillex', '$2b$10$hash26', 'Sonny', 'Moore', '1988-01-15', 'sonny@skrillex.com', 'Artist', '2020-12-15', 'United States', 'Los Angeles', 1, 'Active'),
('deadmau5', '$2b$10$hash27', 'Joel', 'Zimmerman', '1981-01-05', 'joel@deadmau5.com', 'Artist', '2021-01-01', 'Canada', 'Toronto', 1, 'Active'),
('bob_marley', '$2b$10$hash28', 'Bob', 'Marley', '1945-02-06', 'bob@marley.com', 'Artist', '2021-01-15', 'Jamaica', 'Kingston', 0, 'Active'),
('mozart', '$2b$10$hash29', 'Wolfgang', 'Mozart', '1756-01-27', 'wolfgang@mozart.com', 'Artist', '2021-02-01', 'Austria', 'Vienna', 0, 'Active'),
('bob_dylan', '$2b$10$hash30', 'Bob', 'Dylan', '1941-05-24', 'bob@dylan.com', 'Artist', '2021-02-15', 'United States', 'Duluth', 1, 'Active'),
('brian_eno', '$2b$10$hash31', 'Brian', 'Eno', '1948-05-15', 'brian@eno.com', 'Artist', '2021-03-01', 'United Kingdom', 'Woodbridge', 1, 'Active'),
('johnny_cash', '$2b$10$hash32', 'Johnny', 'Cash', '1932-02-26', 'johnny@cash.com', 'Artist', '2021-03-15', 'United States', 'Kingsland', 0, 'Active'),
('aretha_franklin', '$2b$10$hash33', 'Aretha', 'Franklin', '1942-03-25', 'aretha@franklin.com', 'Artist', '2021-04-01', 'United States', 'Memphis', 0, 'Active'),
('radiohead', '$2b$10$hash34', 'Thom', 'Yorke', '1968-10-07', 'thom@radiohead.com', 'Artist', '2021-04-15', 'United Kingdom', 'Oxford', 1, 'Active'),
('david_bowie', '$2b$10$hash35', 'David', 'Bowie', '1947-01-08', 'david@bowie.com', 'Artist', '2021-05-01', 'United Kingdom', 'London', 0, 'Active');

-- Insert Listeners (UserIDs 36-136) - 101 listeners
INSERT INTO userprofile (Username, UserPassword, FirstName, LastName, DateOfBirth, Email, UserType, DateJoined, Country, City, IsOnline, AccountStatus) VALUES
-- Active Listeners (71)
('emma_smith', '$2b$10$hash36', 'Emma', 'Smith', '1995-03-12', 'emma@smith.com', 'Listener', '2020-06-01', 'United States', 'New York', 1, 'Active'),
('michael_johnson', '$2b$10$hash37', 'Michael', 'Johnson', '1992-07-25', 'michael@johnson.com', 'Listener', '2020-06-15', 'United States', 'Los Angeles', 1, 'Active'),
('sarah_williams', '$2b$10$hash38', 'Sarah', 'Williams', '1998-11-03', 'sarah@williams.com', 'Listener', '2020-07-01', 'United States', 'Chicago', 1, 'Active'),
('david_brown', '$2b$10$hash39', 'David', 'Brown', '1991-04-18', 'david@brown.com', 'Listener', '2020-07-15', 'United States', 'Houston', 1, 'Active'),
('lisa_davis', '$2b$10$hash40', 'Lisa', 'Davis', '1996-09-28', 'lisa@davis.com', 'Listener', '2020-08-01', 'United States', 'Phoenix', 1, 'Active'),
('james_wilson', '$2b$10$hash41', 'James', 'Wilson', '1993-12-15', 'james@wilson.com', 'Listener', '2020-08-15', 'United States', 'Philadelphia', 1, 'Active'),
('jennifer_moore', '$2b$10$hash42', 'Jennifer', 'Moore', '1997-06-22', 'jennifer@moore.com', 'Listener', '2020-09-01', 'United States', 'San Antonio', 1, 'Active'),
('robert_taylor', '$2b$10$hash43', 'Robert', 'Taylor', '1990-01-10', 'robert@taylor.com', 'Listener', '2020-09-15', 'United States', 'San Diego', 1, 'Active'),
('maria_garcia', '$2b$10$hash44', 'Maria', 'Garcia', '1994-08-05', 'maria@garcia.com', 'Listener', '2020-10-01', 'United States', 'Dallas', 1, 'Active'),
('william_martinez', '$2b$10$hash45', 'William', 'Martinez', '1999-02-20', 'william@martinez.com', 'Listener', '2020-10-15', 'United States', 'San Jose', 1, 'Active'),
('patricia_anderson', '$2b$10$hash46', 'Patricia', 'Anderson', '1992-05-14', 'patricia@anderson.com', 'Listener', '2020-11-01', 'United States', 'Austin', 1, 'Active'),
('richard_thomas', '$2b$10$hash47', 'Richard', 'Thomas', '1995-10-30', 'richard@thomas.com', 'Listener', '2020-11-15', 'United States', 'Jacksonville', 1, 'Active'),
('linda_hernandez', '$2b$10$hash48', 'Linda', 'Hernandez', '1998-03-17', 'linda@hernandez.com', 'Listener', '2020-12-01', 'United States', 'Fort Worth', 1, 'Active'),
('charles_young', '$2b$10$hash49', 'Charles', 'Young', '1991-12-08', 'charles@young.com', 'Listener', '2020-12-15', 'United States', 'Columbus', 1, 'Active'),
('barbara_king', '$2b$10$hash50', 'Barbara', 'King', '1996-07-25', 'barbara@king.com', 'Listener', '2021-01-01', 'United States', 'Charlotte', 1, 'Active'),
('joseph_lee', '$2b$10$hash51', 'Joseph', 'Lee', '1993-04-12', 'joseph@lee.com', 'Listener', '2021-01-15', 'United States', 'Seattle', 1, 'Active'),
('susan_white', '$2b$10$hash52', 'Susan', 'White', '1997-09-19', 'susan@white.com', 'Listener', '2021-02-01', 'United States', 'Denver', 1, 'Active'),
('thomas_harris', '$2b$10$hash53', 'Thomas', 'Harris', '1990-11-26', 'thomas@harris.com', 'Listener', '2021-02-15', 'United States', 'Washington', 1, 'Active'),
('jessica_clark', '$2b$10$hash54', 'Jessica', 'Clark', '1994-06-03', 'jessica@clark.com', 'Listener', '2021-03-01', 'United States', 'Boston', 1, 'Active'),
('christopher_lewis', '$2b$10$hash55', 'Christopher', 'Lewis', '1999-01-16', 'christopher@lewis.com', 'Listener', '2021-03-15', 'United States', 'El Paso', 1, 'Active'),
('nancy_walker', '$2b$10$hash56', 'Nancy', 'Walker', '1992-08-29', 'nancy@walker.com', 'Listener', '2021-04-01', 'United States', 'Nashville', 1, 'Active'),
('daniel_hall', '$2b$10$hash57', 'Daniel', 'Hall', '1995-12-07', 'daniel@hall.com', 'Listener', '2021-04-15', 'United States', 'Detroit', 1, 'Active'),
('karen_allen', '$2b$10$hash58', 'Karen', 'Allen', '1998-05-24', 'karen@allen.com', 'Listener', '2021-05-01', 'United States', 'Oklahoma City', 1, 'Active'),
('matthew_young', '$2b$10$hash59', 'Matthew', 'Young', '1991-10-11', 'matthew@young.com', 'Listener', '2021-05-15', 'United States', 'Portland', 1, 'Active'),
('helen_king', '$2b$10$hash60', 'Helen', 'King', '1996-03-18', 'helen@king.com', 'Listener', '2021-06-01', 'United States', 'Las Vegas', 1, 'Active'),
('anthony_wright', '$2b$10$hash61', 'Anthony', 'Wright', '1993-07-05', 'anthony@wright.com', 'Listener', '2021-06-15', 'United States', 'Memphis', 1, 'Active'),
('sharon_lopez', '$2b$10$hash62', 'Sharon', 'Lopez', '1997-12-22', 'sharon@lopez.com', 'Listener', '2021-07-01', 'United States', 'Louisville', 1, 'Active'),
('mark_hill', '$2b$10$hash63', 'Mark', 'Hill', '1990-09-08', 'mark@hill.com', 'Listener', '2021-07-15', 'United States', 'Baltimore', 1, 'Active'),
('cynthia_scott', '$2b$10$hash64', 'Cynthia', 'Scott', '1994-04-15', 'cynthia@scott.com', 'Listener', '2021-08-01', 'United States', 'Milwaukee', 1, 'Active'),
('donald_green', '$2b$10$hash65', 'Donald', 'Green', '1999-11-02', 'donald@green.com', 'Listener', '2021-08-15', 'United States', 'Albuquerque', 1, 'Active'),
('kathleen_adams', '$2b$10$hash66', 'Kathleen', 'Adams', '1992-06-19', 'kathleen@adams.com', 'Listener', '2021-09-01', 'United States', 'Tucson', 1, 'Active'),
('steven_baker', '$2b$10$hash67', 'Steven', 'Baker', '1995-01-06', 'steven@baker.com', 'Listener', '2021-09-15', 'United States', 'Fresno', 1, 'Active'),
('deborah_gonzalez', '$2b$10$hash68', 'Deborah', 'Gonzalez', '1998-08-23', 'deborah@gonzalez.com', 'Listener', '2021-10-01', 'United States', 'Sacramento', 1, 'Active'),
('paul_nelson', '$2b$10$hash69', 'Paul', 'Nelson', '1991-03-10', 'paul@nelson.com', 'Listener', '2021-10-15', 'United States', 'Mesa', 1, 'Active'),
('donna_carter', '$2b$10$hash70', 'Donna', 'Carter', '1996-10-27', 'donna@carter.com', 'Listener', '2021-11-01', 'United States', 'Kansas City', 1, 'Active'),
('kenneth_mitchell', '$2b$10$hash71', 'Kenneth', 'Mitchell', '1993-05-14', 'kenneth@mitchell.com', 'Listener', '2021-11-15', 'United States', 'Atlanta', 1, 'Active'),
('carol_perez', '$2b$10$hash72', 'Carol', 'Perez', '1997-12-01', 'carol@perez.com', 'Listener', '2021-12-01', 'United States', 'Omaha', 1, 'Active'),
('gregory_roberts', '$2b$10$hash73', 'Gregory', 'Roberts', '1990-07-18', 'gregory@roberts.com', 'Listener', '2021-12-15', 'United States', 'Miami', 1, 'Active'),
('ruth_turner', '$2b$10$hash74', 'Ruth', 'Turner', '1994-02-05', 'ruth@turner.com', 'Listener', '2022-01-01', 'United States', 'Long Beach', 1, 'Active'),
('raymond_phillips', '$2b$10$hash75', 'Raymond', 'Phillips', '1999-09-12', 'raymond@phillips.com', 'Listener', '2022-01-15', 'United States', 'Virginia Beach', 1, 'Active'),
('janet_campbell', '$2b$10$hash76', 'Janet', 'Campbell', '1992-04-29', 'janet@campbell.com', 'Listener', '2022-02-01', 'United States', 'Colorado Springs', 1, 'Active'),
('jerry_parker', '$2b$10$hash77', 'Jerry', 'Parker', '1995-11-16', 'jerry@parker.com', 'Listener', '2022-02-15', 'United States', 'Raleigh', 1, 'Active'),
('betty_evans', '$2b$10$hash78', 'Betty', 'Evans', '1998-06-03', 'betty@evans.com', 'Listener', '2022-03-01', 'United States', 'Omaha', 1, 'Active'),
('arthur_edwards', '$2b$10$hash79', 'Arthur', 'Edwards', '1991-01-20', 'arthur@edwards.com', 'Listener', '2022-03-15', 'United States', 'Miami', 1, 'Active'),
('dorothy_collins', '$2b$10$hash80', 'Dorothy', 'Collins', '1996-08-07', 'dorothy@collins.com', 'Listener', '2022-04-01', 'United States', 'Virginia Beach', 1, 'Active'),
('ryan_stewart', '$2b$10$hash81', 'Ryan', 'Stewart', '1993-03-24', 'ryan@stewart.com', 'Listener', '2022-04-15', 'United States', 'Colorado Springs', 1, 'Active'),
('frances_sanchez', '$2b$10$hash82', 'Frances', 'Sanchez', '1997-10-11', 'frances@sanchez.com', 'Listener', '2022-05-01', 'United States', 'Raleigh', 1, 'Active'),
('eugene_morris', '$2b$10$hash83', 'Eugene', 'Morris', '1990-05-28', 'eugene@morris.com', 'Listener', '2022-05-15', 'United States', 'Omaha', 1, 'Active'),
('joan_rogers', '$2b$10$hash84', 'Joan', 'Rogers', '1994-12-15', 'joan@rogers.com', 'Listener', '2022-06-01', 'United States', 'Miami', 1, 'Active'),
('wayne_reed', '$2b$10$hash85', 'Wayne', 'Reed', '1999-07-02', 'wayne@reed.com', 'Listener', '2022-06-15', 'United States', 'Virginia Beach', 1, 'Active'),
('evelyn_cook', '$2b$10$hash86', 'Evelyn', 'Cook', '1992-02-19', 'evelyn@cook.com', 'Listener', '2022-07-01', 'United States', 'Colorado Springs', 1, 'Active'),
('ralph_morgan', '$2b$10$hash87', 'Ralph', 'Morgan', '1995-09-06', 'ralph@morgan.com', 'Listener', '2022-07-15', 'United States', 'Raleigh', 1, 'Active'),
('jean_bell', '$2b$10$hash88', 'Jean', 'Bell', '1998-04-23', 'jean@bell.com', 'Listener', '2022-08-01', 'United States', 'Omaha', 1, 'Active'),
('bobby_murphy', '$2b$10$hash89', 'Bobby', 'Murphy', '1991-11-10', 'bobby@murphy.com', 'Listener', '2022-08-15', 'United States', 'Miami', 1, 'Active'),
('gloria_bailey', '$2b$10$hash90', 'Gloria', 'Bailey', '1996-06-27', 'gloria@bailey.com', 'Listener', '2022-09-01', 'United States', 'Virginia Beach', 1, 'Active'),
('victor_rivera', '$2b$10$hash91', 'Victor', 'Rivera', '1993-01-14', 'victor@rivera.com', 'Listener', '2022-09-15', 'United States', 'Colorado Springs', 1, 'Active'),
('martha_cooper', '$2b$10$hash92', 'Martha', 'Cooper', '1997-08-01', 'martha@cooper.com', 'Listener', '2022-10-01', 'United States', 'Raleigh', 1, 'Active'),
('ernest_richardson', '$2b$10$hash93', 'Ernest', 'Richardson', '1990-03-18', 'ernest@richardson.com', 'Listener', '2022-10-15', 'United States', 'Omaha', 1, 'Active'),
('marie_cox', '$2b$10$hash94', 'Marie', 'Cox', '1994-10-05', 'marie@cox.com', 'Listener', '2022-11-01', 'United States', 'Miami', 1, 'Active'),
('phillip_ward', '$2b$10$hash95', 'Phillip', 'Ward', '1999-04-22', 'phillip@ward.com', 'Listener', '2022-11-15', 'United States', 'Virginia Beach', 1, 'Active'),
('ruby_torres', '$2b$10$hash96', 'Ruby', 'Torres', '1992-11-09', 'ruby@torres.com', 'Listener', '2022-12-01', 'United States', 'Colorado Springs', 1, 'Active'),
('louis_peterson', '$2b$10$hash97', 'Louis', 'Peterson', '1995-06-26', 'louis@peterson.com', 'Listener', '2022-12-15', 'United States', 'Raleigh', 1, 'Active'),
('florence_gray', '$2b$10$hash98', 'Florence', 'Gray', '1998-01-13', 'florence@gray.com', 'Listener', '2023-01-01', 'United States', 'Omaha', 1, 'Active'),
('lawrence_ramirez', '$2b$10$hash99', 'Lawrence', 'Ramirez', '1991-08-30', 'lawrence@ramirez.com', 'Listener', '2023-01-15', 'United States', 'Miami', 1, 'Active'),
('rose_james', '$2b$10$hash100', 'Rose', 'James', '1996-03-17', 'rose@james.com', 'Listener', '2023-02-01', 'United States', 'Virginia Beach', 1, 'Active'),
('albert_watson', '$2b$10$hash101', 'Albert', 'Watson', '1993-10-04', 'albert@watson.com', 'Listener', '2023-02-15', 'United States', 'Colorado Springs', 1, 'Active'),
('eleanor_brooks', '$2b$10$hash102', 'Eleanor', 'Brooks', '1997-05-21', 'eleanor@brooks.com', 'Listener', '2023-03-01', 'United States', 'Raleigh', 1, 'Active'),
('samuel_kelly', '$2b$10$hash103', 'Samuel', 'Kelly', '1990-12-08', 'samuel@kelly.com', 'Listener', '2023-03-15', 'United States', 'Omaha', 1, 'Active'),
('louise_sanders', '$2b$10$hash104', 'Louise', 'Sanders', '1994-07-25', 'louise@sanders.com', 'Listener', '2023-04-01', 'United States', 'Miami', 1, 'Active'),
('joe_price', '$2b$10$hash105', 'Joe', 'Price', '1999-02-12', 'joe@price.com', 'Listener', '2023-04-15', 'United States', 'Virginia Beach', 1, 'Active'),
('mildred_bennett', '$2b$10$hash106', 'Mildred', 'Bennett', '1992-09-29', 'mildred@bennett.com', 'Listener', '2023-05-01', 'United States', 'Colorado Springs', 1, 'Active'),
('jimmy_wood', '$2b$10$hash107', 'Jimmy', 'Wood', '1995-04-16', 'jimmy@wood.com', 'Listener', '2023-05-15', 'United States', 'Raleigh', 1, 'Active'),
('lillian_barnes', '$2b$10$hash108', 'Lillian', 'Barnes', '1998-11-03', 'lillian@barnes.com', 'Listener', '2023-06-01', 'United States', 'Omaha', 1, 'Active'),
('craig_ross', '$2b$10$hash109', 'Craig', 'Ross', '1991-06-20', 'craig@ross.com', 'Listener', '2023-06-15', 'United States', 'Miami', 1, 'Active'),
('gladys_henderson', '$2b$10$hash110', 'Gladys', 'Henderson', '1996-01-07', 'gladys@henderson.com', 'Listener', '2023-07-01', 'United States', 'Virginia Beach', 1, 'Active'),
('eugene_coleman', '$2b$10$hash111', 'Eugene', 'Coleman', '1993-08-24', 'eugene@coleman.com', 'Listener', '2023-07-15', 'United States', 'Colorado Springs', 1, 'Active'),
('ethel_jenkins', '$2b$10$hash112', 'Ethel', 'Jenkins', '1997-03-11', 'ethel@jenkins.com', 'Listener', '2023-08-01', 'United States', 'Raleigh', 1, 'Active'),
('alan_perry', '$2b$10$hash113', 'Alan', 'Perry', '1990-10-28', 'alan@perry.com', 'Listener', '2023-08-15', 'United States', 'Omaha', 1, 'Active'),
('edna_powell', '$2b$10$hash114', 'Edna', 'Powell', '1994-05-15', 'edna@powell.com', 'Listener', '2023-09-01', 'United States', 'Miami', 1, 'Active'),
('juan_long', '$2b$10$hash115', 'Juan', 'Long', '1999-12-02', 'juan@long.com', 'Listener', '2023-09-15', 'United States', 'Virginia Beach', 1, 'Active'),
('marie_patterson', '$2b$10$hash116', 'Marie', 'Patterson', '1992-07-19', 'marie@patterson.com', 'Listener', '2023-10-01', 'United States', 'Colorado Springs', 1, 'Active'),
('wayne_hughes', '$2b$10$hash117', 'Wayne', 'Hughes', '1995-02-06', 'wayne@hughes.com', 'Listener', '2023-10-15', 'United States', 'Raleigh', 1, 'Active'),
('ruby_flores', '$2b$10$hash118', 'Ruby', 'Flores', '1998-09-23', 'ruby@flores.com', 'Listener', '2023-11-01', 'United States', 'Omaha', 1, 'Active'),
('ralph_washington', '$2b$10$hash119', 'Ralph', 'Washington', '1991-04-10', 'ralph@washington.com', 'Listener', '2023-11-15', 'United States', 'Miami', 1, 'Active'),
('evelyn_butler', '$2b$10$hash120', 'Evelyn', 'Butler', '1996-11-27', 'evelyn@butler.com', 'Listener', '2023-12-01', 'United States', 'Virginia Beach', 1, 'Active'),
('roy_simmons', '$2b$10$hash121', 'Roy', 'Simmons', '1993-06-14', 'roy@simmons.com', 'Listener', '2023-12-15', 'United States', 'Colorado Springs', 1, 'Active'),
('jean_foster', '$2b$10$hash122', 'Jean', 'Foster', '1997-01-01', 'jean@foster.com', 'Listener', '2024-01-01', 'United States', 'Raleigh', 1, 'Active'),
('eugene_gonzales', '$2b$10$hash123', 'Eugene', 'Gonzales', '1990-08-18', 'eugene@gonzales.com', 'Listener', '2024-01-15', 'United States', 'Omaha', 1, 'Active'),
('gloria_bryant', '$2b$10$hash124', 'Gloria', 'Bryant', '1994-03-05', 'gloria@bryant.com', 'Listener', '2024-02-01', 'United States', 'Miami', 1, 'Active'),
('ralph_alexander', '$2b$10$hash125', 'Ralph', 'Alexander', '1999-10-22', 'ralph@alexander.com', 'Listener', '2024-02-15', 'United States', 'Virginia Beach', 1, 'Active'),
('marie_russell', '$2b$10$hash126', 'Marie', 'Russell', '1992-05-09', 'marie@russell.com', 'Listener', '2024-03-01', 'United States', 'Colorado Springs', 1, 'Active'),
('wayne_griffin', '$2b$10$hash127', 'Wayne', 'Griffin', '1995-12-26', 'wayne@griffin.com', 'Listener', '2024-03-15', 'United States', 'Raleigh', 1, 'Active'),
('ruby_diaz', '$2b$10$hash128', 'Ruby', 'Diaz', '1998-07-13', 'ruby@diaz.com', 'Listener', '2024-04-01', 'United States', 'Omaha', 1, 'Active'),
('ralph_hayes', '$2b$10$hash129', 'Ralph', 'Hayes', '1991-02-28', 'ralph@hayes.com', 'Listener', '2024-04-15', 'United States', 'Miami', 1, 'Active'),
('evelyn_myers', '$2b$10$hash130', 'Evelyn', 'Myers', '1996-09-15', 'evelyn@myers.com', 'Listener', '2024-05-01', 'United States', 'Virginia Beach', 1, 'Active'),
('roy_ford', '$2b$10$hash131', 'Roy', 'Ford', '1993-04-02', 'roy@ford.com', 'Listener', '2024-05-15', 'United States', 'Colorado Springs', 1, 'Active'),
('jean_hamilton', '$2b$10$hash132', 'Jean', 'Hamilton', '1997-11-19', 'jean@hamilton.com', 'Listener', '2024-06-01', 'United States', 'Raleigh', 1, 'Active'),
('eugene_graham', '$2b$10$hash133', 'Eugene', 'Graham', '1990-06-06', 'eugene@graham.com', 'Listener', '2024-06-15', 'United States', 'Omaha', 1, 'Active'),
('gloria_sullivan', '$2b$10$hash134', 'Gloria', 'Sullivan', '1994-01-23', 'gloria@sullivan.com', 'Listener', '2024-07-01', 'United States', 'Miami', 1, 'Active'),
('ralph_wallace', '$2b$10$hash135', 'Ralph', 'Wallace', '1999-08-10', 'ralph@wallace.com', 'Listener', '2024-07-15', 'United States', 'Virginia Beach', 1, 'Active'),
('marie_woods', '$2b$10$hash136', 'Marie', 'Woods', '1992-03-27', 'marie@woods.com', 'Listener', '2024-08-01', 'United States', 'Colorado Springs', 1, 'Active'),

-- Suspended Listeners (23)
('suspended_user1', '$2b$10$hash137', 'Suspended', 'User1', '1990-01-01', 'suspended1@user.com', 'Listener', '2020-06-01', 'United States', 'Nowhere', 0, 'Suspended'),
('suspended_user2', '$2b$10$hash138', 'Suspended', 'User2', '1991-02-02', 'suspended2@user.com', 'Listener', '2020-07-01', 'United States', 'Somewhere', 0, 'Suspended'),
('suspended_user3', '$2b$10$hash139', 'Suspended', 'User3', '1992-03-03', 'suspended3@user.com', 'Listener', '2020-08-01', 'United States', 'Anywhere', 0, 'Suspended'),
('suspended_user4', '$2b$10$hash140', 'Suspended', 'User4', '1993-04-04', 'suspended4@user.com', 'Listener', '2020-09-01', 'United States', 'Everywhere', 0, 'Suspended'),
('suspended_user5', '$2b$10$hash141', 'Suspended', 'User5', '1994-05-05', 'suspended5@user.com', 'Listener', '2020-10-01', 'United States', 'Nowhere', 0, 'Suspended'),
('suspended_user6', '$2b$10$hash142', 'Suspended', 'User6', '1995-06-06', 'suspended6@user.com', 'Listener', '2020-11-01', 'United States', 'Somewhere', 0, 'Suspended'),
('suspended_user7', '$2b$10$hash143', 'Suspended', 'User7', '1996-07-07', 'suspended7@user.com', 'Listener', '2020-12-01', 'United States', 'Anywhere', 0, 'Suspended'),
('suspended_user8', '$2b$10$hash144', 'Suspended', 'User8', '1997-08-08', 'suspended8@user.com', 'Listener', '2021-01-01', 'United States', 'Everywhere', 0, 'Suspended'),
('suspended_user9', '$2b$10$hash145', 'Suspended', 'User9', '1998-09-09', 'suspended9@user.com', 'Listener', '2021-02-01', 'United States', 'Nowhere', 0, 'Suspended'),
('suspended_user10', '$2b$10$hash146', 'Suspended', 'User10', '1999-10-10', 'suspended10@user.com', 'Listener', '2021-03-01', 'United States', 'Somewhere', 0, 'Suspended'),
('suspended_user11', '$2b$10$hash147', 'Suspended', 'User11', '2000-11-11', 'suspended11@user.com', 'Listener', '2021-04-01', 'United States', 'Anywhere', 0, 'Suspended'),
('suspended_user12', '$2b$10$hash148', 'Suspended', 'User12', '2001-12-12', 'suspended12@user.com', 'Listener', '2021-05-01', 'United States', 'Everywhere', 0, 'Suspended'),
('suspended_user13', '$2b$10$hash149', 'Suspended', 'User13', '2002-01-13', 'suspended13@user.com', 'Listener', '2021-06-01', 'United States', 'Nowhere', 0, 'Suspended'),
('suspended_user14', '$2b$10$hash150', 'Suspended', 'User14', '2003-02-14', 'suspended14@user.com', 'Listener', '2021-07-01', 'United States', 'Somewhere', 0, 'Suspended'),
('suspended_user15', '$2b$10$hash151', 'Suspended', 'User15', '2004-03-15', 'suspended15@user.com', 'Listener', '2021-08-01', 'United States', 'Anywhere', 0, 'Suspended'),
('suspended_user16', '$2b$10$hash152', 'Suspended', 'User16', '2005-04-16', 'suspended16@user.com', 'Listener', '2021-09-01', 'United States', 'Everywhere', 0, 'Suspended'),
('suspended_user17', '$2b$10$hash153', 'Suspended', 'User17', '2006-05-17', 'suspended17@user.com', 'Listener', '2021-10-01', 'United States', 'Nowhere', 0, 'Suspended'),
('suspended_user18', '$2b$10$hash154', 'Suspended', 'User18', '2007-06-18', 'suspended18@user.com', 'Listener', '2021-11-01', 'United States', 'Somewhere', 0, 'Suspended'),
('suspended_user19', '$2b$10$hash155', 'Suspended', 'User19', '2008-07-19', 'suspended19@user.com', 'Listener', '2021-12-01', 'United States', 'Anywhere', 0, 'Suspended'),
('suspended_user20', '$2b$10$hash156', 'Suspended', 'User20', '2009-08-20', 'suspended20@user.com', 'Listener', '2022-01-01', 'United States', 'Everywhere', 0, 'Suspended'),
('suspended_user21', '$2b$10$hash157', 'Suspended', 'User21', '2010-09-21', 'suspended21@user.com', 'Listener', '2022-02-01', 'United States', 'Nowhere', 0, 'Suspended'),
('suspended_user22', '$2b$10$hash158', 'Suspended', 'User22', '2011-10-22', 'suspended22@user.com', 'Listener', '2022-03-01', 'United States', 'Somewhere', 0, 'Suspended'),
('suspended_user23', '$2b$10$hash159', 'Suspended', 'User23', '2012-11-23', 'suspended23@user.com', 'Listener', '2022-04-01', 'United States', 'Anywhere', 0, 'Suspended'),

-- Banned Listeners (6)
('banned_user1', '$2b$10$hash160', 'Banned', 'User1', '1990-01-01', 'banned1@user.com', 'Listener', '2020-06-01', 'United States', 'Nowhere', 0, 'Banned'),
('banned_user2', '$2b$10$hash161', 'Banned', 'User2', '1991-02-02', 'banned2@user.com', 'Listener', '2020-07-01', 'United States', 'Somewhere', 0, 'Banned'),
('banned_user3', '$2b$10$hash162', 'Banned', 'User3', '1992-03-03', 'banned3@user.com', 'Listener', '2020-08-01', 'United States', 'Anywhere', 0, 'Banned'),
('banned_user4', '$2b$10$hash163', 'Banned', 'User4', '1993-04-04', 'banned4@user.com', 'Listener', '2020-09-01', 'United States', 'Everywhere', 0, 'Banned'),
('banned_user5', '$2b$10$hash164', 'Banned', 'User5', '1994-05-05', 'banned5@user.com', 'Listener', '2020-10-01', 'United States', 'Nowhere', 0, 'Banned'),
('banned_user6', '$2b$10$hash165', 'Banned', 'User6', '1995-06-06', 'banned6@user.com', 'Listener', '2020-11-01', 'United States', 'Somewhere', 0, 'Banned');

-- Insert Artist Profiles (ArtistIDs 5-35)
INSERT INTO artist (ArtistID, ArtistBio, VerifiedStatus, VerifyingAdminID, DateVerified) VALUES
(5, 'Country-pop superstar known for storytelling lyrics and catchy melodies. Multiple Grammy winner and global phenomenon.', 1, 1, '2020-02-15 10:00:00'),
(6, 'British singer-songwriter with acoustic guitar mastery. Known for heartfelt lyrics and loop pedal performances.', 1, 1, '2020-02-20 14:30:00'),
(7, 'Alternative pop sensation with haunting vocals and dark, introspective lyrics. Grammy-winning artist.', 1, 2, '2020-03-05 16:45:00'),
(8, 'R&B and pop artist known for smooth vocals and atmospheric production. Multiple chart-topping hits.', 1, 1, '2020-03-20 13:20:00'),
(9, 'Pop diva with incredible vocal range and stage presence. Known for powerful ballads and dance hits.', 1, 2, '2020-04-05 12:00:00'),
(10, 'Rap superstar and entrepreneur. Known for melodic rap style and business ventures.', 1, 1, '2020-04-20 15:30:00'),
(11, 'R&B queen and cultural icon. Known for powerful vocals and empowering anthems.', 1, 2, '2020-05-05 10:15:00'),
(12, 'Conscious rapper and Pulitzer Prize winner. Known for complex lyrics and social commentary.', 1, 1, '2020-05-20 14:00:00'),
(13, 'Alternative pop artist from New Zealand. Known for unique sound and introspective lyrics.', 1, 2, '2020-06-05 11:45:00'),
(14, 'Alternative R&B artist known for experimental sound and emotional depth.', 1, 1, '2020-06-20 16:30:00'),
(15, 'British singer-songwriter known for powerful vocals and emotional ballads. Multiple Grammy and Academy Award winner.', 1, 2, '2020-07-15 10:00:00'),
(16, 'American singer, songwriter, and record producer. Known for funk, pop, and R&B fusion with energetic performances.', 1, 1, '2020-07-30 14:30:00'),
(17, 'British-Albanian singer and songwriter. Known for disco-influenced pop and powerful vocals.', 1, 2, '2020-08-15 12:00:00'),
(18, 'British singer-songwriter and actor. Former One Direction member turned solo artist with indie pop sound.', 1, 1, '2020-08-30 16:45:00'),
(19, 'American singer-songwriter and actress. Known for pop-punk and alternative pop with emotional lyrics.', 1, 2, '2020-09-15 18:30:00'),
(20, 'British rock band and cultural phenomenon. Known for innovative songwriting and musical experimentation.', 1, 1, '2020-09-30 20:00:00'),
(21, 'British rock band known for diverse musical styles and theatrical performances. Rock opera pioneers.', 1, 2, '2020-10-15 22:15:00'),
(22, 'British rock band and hard rock pioneers. Known for powerful vocals and heavy guitar riffs.', 1, 1, '2020-10-30 10:30:00'),
(23, 'British rock band known for progressive rock and concept albums. Psychedelic rock pioneers.', 1, 2, '2020-11-15 12:45:00'),
(24, 'American rock band and grunge pioneers. Known for alternative rock and cultural impact.', 1, 1, '2020-11-30 14:20:00'),
(25, 'American heavy metal band known for aggressive sound and complex compositions. Pioneers of thrash metal.', 1, 2, '2020-12-15 16:00:00'),
(26, 'American electronic music producer and DJ. Known for dubstep and electronic dance music innovation.', 1, 1, '2020-12-30 18:30:00'),
(27, 'Canadian electronic music producer and DJ. Known for progressive house and techno music.', 1, 2, '2021-01-15 20:15:00'),
(28, 'Jamaican reggae singer, songwriter, and musician. Cultural icon and reggae pioneer.', 1, 1, '2021-01-30 22:00:00'),
(29, 'Austrian composer and musician. One of the most influential composers in Western classical music.', 1, 2, '2021-02-15 08:30:00'),
(30, 'American singer-songwriter and folk musician. Nobel Prize winner and cultural icon.', 1, 1, '2021-02-28 10:45:00'),
(31, 'British musician, composer, and producer. Pioneer of ambient music and electronic experimentation.', 1, 2, '2021-03-15 12:30:00'),
(32, 'American country music singer-songwriter. Known as "The Man in Black" and country music legend.', 1, 1, '2021-03-30 14:15:00'),
(33, 'American singer-songwriter and pianist. Known as "The Queen of Soul" and R&B legend.', 1, 2, '2021-04-15 16:00:00'),
(34, 'British rock band known for experimental and alternative rock. Influential in alternative music.', 1, 1, '2021-04-30 18:30:00'),
(35, 'British singer-songwriter and actor. Known for innovative music and theatrical performances.', 1, 2, '2021-05-15 20:15:00');

-- Insert Albums (AlbumIDs 1-70)
INSERT INTO album (ArtistID, AlbumName, ReleaseDate, AlbumCover, Description) VALUES
-- Taylor Swift albums
(5, 'Folklore', '2020-07-24', 'folklore_cover.jpg', 'Indie folk album written and recorded during quarantine'),
(5, 'Evermore', '2020-12-11', 'evermore_cover.jpg', 'Sister album to Folklore with more experimental sounds'),
(5, 'Midnights', '2022-10-21', 'midnights_cover.jpg', 'Concept album about 13 sleepless nights'),

-- Ed Sheeran albums
(6, 'Divide', '2017-03-03', 'divide_cover.jpg', 'Third studio album with global hits'),
(6, 'No.6 Collaborations Project', '2019-07-12', 'no6_cover.jpg', 'Collaborative album with various artists'),
(6, 'Equals', '2021-10-29', 'equals_cover.jpg', 'Fourth studio album exploring new sounds'),

-- Billie Eilish albums
(7, 'When We All Fall Asleep', '2019-03-29', 'wwafawd_cover.jpg', 'Debut album with dark, experimental pop'),
(7, 'Happier Than Ever', '2021-07-30', 'hte_cover.jpg', 'Sophomore album with more mature themes'),

-- The Weeknd albums
(8, 'After Hours', '2020-03-20', 'after_hours_cover.jpg', 'Synth-pop and R&B fusion'),
(8, 'Dawn FM', '2022-01-07', 'dawn_fm_cover.jpg', 'Concept album with radio show format'),

-- Ariana Grande albums
(9, 'Positions', '2020-10-30', 'positions_cover.jpg', 'R&B and trap-influenced pop album'),
(9, 'Sweetener', '2018-08-17', 'sweetener_cover.jpg', 'Pop album with trap and R&B elements'),

-- Drake albums
(10, 'Certified Lover Boy', '2021-09-03', 'clb_cover.jpg', 'Rap album with R&B influences'),
(10, 'Honestly, Nevermind', '2022-06-17', 'hn_cover.jpg', 'Dance and house music experiment'),

-- Beyoncé albums
(11, 'Renaissance', '2022-07-29', 'renaissance_cover.jpg', 'Dance and house music celebration'),
(11, 'Lemonade', '2016-04-23', 'lemonade_cover.jpg', 'Visual album exploring themes of infidelity'),

-- Kendrick Lamar albums
(12, 'DAMN.', '2017-04-14', 'damn_cover.jpg', 'Pulitzer Prize-winning rap album'),
(12, 'Mr. Morale & The Big Steppers', '2022-05-13', 'mmtbs_cover.jpg', 'Double album exploring trauma and therapy'),

-- Lorde albums
(13, 'Melodrama', '2017-06-16', 'melodrama_cover.jpg', 'Electropop album about heartbreak'),
(13, 'Solar Power', '2021-08-20', 'solar_power_cover.jpg', 'Folk-pop album with environmental themes'),

-- Frank Ocean albums
(14, 'Blonde', '2016-08-20', 'blonde_cover.jpg', 'Alternative R&B masterpiece'),
(14, 'Channel Orange', '2012-07-10', 'channel_orange_cover.jpg', 'Debut album with R&B and soul influences'),

-- Adele albums
(15, '30', '2021-11-19', '30_cover.jpg', 'Fourth studio album exploring themes of divorce and self-discovery'),
(15, '25', '2015-11-20', '25_cover.jpg', 'Third studio album with global success'),

-- Bruno Mars albums
(16, '24K Magic', '2016-11-18', '24k_magic_cover.jpg', 'Funk and R&B influenced pop album'),
(16, 'Unorthodox Jukebox', '2012-12-07', 'uj_cover.jpg', 'Second studio album with diverse influences'),

-- Dua Lipa albums
(17, 'Future Nostalgia', '2020-03-27', 'fn_cover.jpg', 'Disco-influenced pop album'),
(17, 'Dua Lipa', '2017-06-02', 'dl_cover.jpg', 'Debut studio album'),

-- Harry Styles albums
(18, 'Harrys House', '2022-05-20', 'hh_cover.jpg', 'Third studio album with indie pop sound'),
(18, 'Fine Line', '2019-12-13', 'fl_cover.jpg', 'Second studio album'),

-- Olivia Rodrigo albums
(19, 'Sour', '2021-05-21', 'sour_cover.jpg', 'Debut studio album with pop-punk influences'),
(19, 'Guts', '2023-09-08', 'guts_cover.jpg', 'Second studio album with rock influences'),

-- The Beatles albums
(20, 'Abbey Road', '1969-09-26', 'abbey_road_cover.jpg', 'Final studio album recorded by the Beatles'),
(20, 'Sgt. Peppers Lonely Hearts Club Band', '1967-06-01', 'sgt_peppers_cover.jpg', 'Concept album that revolutionized rock music'),

-- Queen albums
(21, 'A Night at the Opera', '1975-11-21', 'night_opera_cover.jpg', 'Fourth studio album and rock opera'),
(21, 'News of the World', '1977-10-28', 'news_world_cover.jpg', 'Sixth studio album with stadium rock anthems'),

-- Led Zeppelin albums
(22, 'Led Zeppelin IV', '1971-11-08', 'zeppelin4_cover.jpg', 'Fourth studio album and hard rock classic'),
(22, 'Physical Graffiti', '1975-02-24', 'physical_graffiti_cover.jpg', 'Sixth studio album and double album'),

-- Pink Floyd albums
(23, 'The Dark Side of the Moon', '1973-03-01', 'dark_side_cover.jpg', 'Eighth studio album and progressive rock masterpiece'),
(23, 'The Wall', '1979-11-30', 'wall_cover.jpg', 'Eleventh studio album and rock opera'),

-- Nirvana albums
(24, 'Nevermind', '1991-09-24', 'nevermind_cover.jpg', 'Second studio album and grunge classic'),
(24, 'In Utero', '1993-09-21', 'in_utero_cover.jpg', 'Third and final studio album'),

-- Metallica albums
(25, 'Master of Puppets', '1986-03-03', 'mop_cover.jpg', 'Third studio album and thrash metal masterpiece'),
(25, 'Metallica (Black Album)', '1991-08-12', 'black_album_cover.jpg', 'Fifth studio album with mainstream success'),

-- Skrillex albums
(26, 'Scary Monsters and Nice Sprites', '2010-10-22', 'smns_cover.jpg', 'EP that popularized dubstep in America'),
(26, 'Bangarang', '2011-12-23', 'bangarang_cover.jpg', 'EP with electronic and dubstep tracks'),

-- Deadmau5 albums
(27, '4x4=12', '2010-12-06', '4x4_cover.jpg', 'Fourth studio album with progressive house'),
(27, 'While(1<2)', '2014-06-17', 'while_cover.jpg', 'Seventh studio album with ambient and techno'),

-- Bob Marley albums
(28, 'Exodus', '1977-06-03', 'exodus_cover.jpg', 'Ninth studio album and reggae classic'),
(28, 'Legend', '1984-05-08', 'legend_cover.jpg', 'Greatest hits compilation'),

-- Mozart albums
(29, 'Symphony No. 40', '1788-07-25', 'symphony40_cover.jpg', 'Classical symphony masterpiece'),
(29, 'The Magic Flute', '1791-09-30', 'magic_flute_cover.jpg', 'Opera in two acts'),

-- Bob Dylan albums
(30, 'Highway 61 Revisited', '1965-08-30', 'highway61_cover.jpg', 'Sixth studio album with folk rock'),
(30, 'Blood on the Tracks', '1975-01-17', 'blood_tracks_cover.jpg', 'Fifteenth studio album with folk and country'),

-- Brian Eno albums
(31, 'Music for Airports', '1978-01-01', 'airports_cover.jpg', 'Ambient music masterpiece'),
(31, 'Another Green World', '1975-09-01', 'green_world_cover.jpg', 'Third studio album with ambient elements'),

-- Johnny Cash albums
(32, 'At Folsom Prison', '1968-05-06', 'folsom_cover.jpg', 'Live album recorded at Folsom Prison'),
(32, 'American IV: The Man Comes Around', '2002-11-05', 'man_comes_around_cover.jpg', 'Fourth American album'),

-- Aretha Franklin albums
(33, 'I Never Loved a Man the Way I Love You', '1967-03-10', 'never_loved_cover.jpg', 'Twelfth studio album and soul classic'),
(33, 'Amazing Grace', '1972-06-01', 'amazing_grace_cover.jpg', 'Gospel album'),

-- Radiohead albums
(34, 'OK Computer', '1997-05-21', 'ok_computer_cover.jpg', 'Third studio album and alternative rock masterpiece'),
(34, 'Kid A', '2000-10-02', 'kid_a_cover.jpg', 'Fourth studio album with electronic elements'),

-- David Bowie albums
(35, 'The Rise and Fall of Ziggy Stardust', '1972-06-16', 'ziggy_cover.jpg', 'Fifth studio album and glam rock classic'),
(35, 'Heroes', '1977-10-14', 'heroes_cover.jpg', 'Twelfth studio album and Berlin trilogy finale');

-- Insert Songs (SongIDs 1-350) - 5 songs per album, covering all genres
INSERT INTO song (SongName, ArtistID, AlbumID, GenreID, Duration, ListenCount, FilePath, FileSize, ReleaseDate) VALUES
-- Taylor Swift - Folklore (Pop/Folk - GenreID 1/14)
('The 1', 5, 1, 1, 240, 1500000, '/music/taylor_swift/folklore/the_1.mp3', 8000000, '2020-07-24'),
('Cardigan', 5, 1, 1, 195, 2500000, '/music/taylor_swift/folklore/cardigan.mp3', 6500000, '2020-07-24'),
('The Last Great American Dynasty', 5, 1, 14, 210, 1200000, '/music/taylor_swift/folklore/tlgad.mp3', 7000000, '2020-07-24'),
('Exile', 5, 1, 1, 245, 1800000, '/music/taylor_swift/folklore/exile.mp3', 8200000, '2020-07-24'),
('My Tears Ricochet', 5, 1, 1, 200, 1600000, '/music/taylor_swift/folklore/mtr.mp3', 6800000, '2020-07-24'),

-- Taylor Swift - Evermore (Pop/Folk - GenreID 1/14)
('Willow', 5, 2, 1, 190, 2000000, '/music/taylor_swift/evermore/willow.mp3', 6300000, '2020-12-11'),
('Champagne Problems', 5, 2, 14, 280, 1500000, '/music/taylor_swift/evermore/champagne_problems.mp3', 9400000, '2020-12-11'),
('Gold Rush', 5, 2, 1, 195, 1300000, '/music/taylor_swift/evermore/gold_rush.mp3', 6500000, '2020-12-11'),
('Tis the Damn Season', 5, 2, 14, 220, 1100000, '/music/taylor_swift/evermore/ttds.mp3', 7300000, '2020-12-11'),
('Tolerate It', 5, 2, 1, 250, 1200000, '/music/taylor_swift/evermore/tolerate_it.mp3', 8300000, '2020-12-11'),

-- Taylor Swift - Midnights (Pop - GenreID 1)
('Anti-Hero', 5, 3, 1, 200, 3000000, '/music/taylor_swift/midnights/anti_hero.mp3', 6700000, '2022-10-21'),
('Lavender Haze', 5, 3, 1, 195, 2500000, '/music/taylor_swift/midnights/lavender_haze.mp3', 6500000, '2022-10-21'),
('Maroon', 5, 3, 1, 220, 1800000, '/music/taylor_swift/midnights/maroon.mp3', 7300000, '2022-10-21'),
('Snow On The Beach', 5, 3, 1, 240, 2000000, '/music/taylor_swift/midnights/snow_beach.mp3', 8000000, '2022-10-21'),
('Youre On Your Own Kid', 5, 3, 1, 210, 1600000, '/music/taylor_swift/midnights/yoyok.mp3', 7000000, '2022-10-21'),

-- Ed Sheeran - Divide (Pop/Folk - GenreID 1/14)
('Shape of You', 6, 4, 1, 233, 5000000, '/music/ed_sheeran/divide/shape_of_you.mp3', 7800000, '2017-03-03'),
('Castle on the Hill', 6, 4, 14, 260, 3000000, '/music/ed_sheeran/divide/castle_hill.mp3', 8700000, '2017-03-03'),
('Galway Girl', 6, 4, 14, 170, 2500000, '/music/ed_sheeran/divide/galway_girl.mp3', 5700000, '2017-03-03'),
('Perfect', 6, 4, 1, 263, 4000000, '/music/ed_sheeran/divide/perfect.mp3', 8800000, '2017-03-03'),
('Happier', 6, 4, 1, 207, 2000000, '/music/ed_sheeran/divide/happier.mp3', 6900000, '2017-03-03'),

-- Ed Sheeran - No.6 Collaborations Project (Pop - GenreID 1)
('Beautiful People', 6, 5, 1, 200, 1800000, '/music/ed_sheeran/no6/beautiful_people.mp3', 6700000, '2019-07-12'),
('South of the Border', 6, 5, 1, 240, 2200000, '/music/ed_sheeran/no6/south_border.mp3', 8000000, '2019-07-12'),
('Cross Me', 6, 5, 1, 190, 1500000, '/music/ed_sheeran/no6/cross_me.mp3', 6300000, '2019-07-12'),
('Take Me Back to London', 6, 5, 1, 220, 1600000, '/music/ed_sheeran/no6/take_me_back.mp3', 7300000, '2019-07-12'),
('I Dont Care', 6, 5, 1, 220, 2800000, '/music/ed_sheeran/no6/i_dont_care.mp3', 7300000, '2019-07-12'),

-- Ed Sheeran - Equals (Pop - GenreID 1)
('Bad Habits', 6, 6, 1, 231, 3500000, '/music/ed_sheeran/equals/bad_habits.mp3', 7700000, '2021-10-29'),
('Shivers', 6, 6, 1, 207, 2800000, '/music/ed_sheeran/equals/shivers.mp3', 6900000, '2021-10-29'),
('Overpass Graffiti', 6, 6, 1, 240, 1800000, '/music/ed_sheeran/equals/overpass_graffiti.mp3', 8000000, '2021-10-29'),
('The Joker and the Queen', 6, 6, 1, 200, 1200000, '/music/ed_sheeran/equals/joker_queen.mp3', 6700000, '2021-10-29'),
('2step', 6, 6, 1, 180, 1500000, '/music/ed_sheeran/equals/2step.mp3', 6000000, '2021-10-29'),

-- Billie Eilish - When We All Fall Asleep (Alternative/Pop - GenreID 13/1)
('Bad Guy', 7, 7, 13, 194, 6000000, '/music/billie_eilish/wwafawd/bad_guy.mp3', 6500000, '2019-03-29'),
('Xanny', 7, 7, 13, 240, 2000000, '/music/billie_eilish/wwafawd/xanny.mp3', 8000000, '2019-03-29'),
('You Should See Me in a Crown', 7, 7, 13, 180, 2500000, '/music/billie_eilish/wwafawd/yssmc.mp3', 6000000, '2019-03-29'),
('All the Good Girls Go to Hell', 7, 7, 13, 170, 1800000, '/music/billie_eilish/wwafawd/atgggth.mp3', 5700000, '2019-03-29'),
('Wish You Were Gay', 7, 7, 13, 200, 2200000, '/music/billie_eilish/wwafawd/wywg.mp3', 6700000, '2019-03-29'),

-- Billie Eilish - Happier Than Ever (Alternative/Pop - GenreID 13/1)
('Getting Older', 7, 8, 13, 240, 1500000, '/music/billie_eilish/hte/getting_older.mp3', 8000000, '2021-07-30'),
('I Didnt Change My Number', 7, 8, 13, 200, 1200000, '/music/billie_eilish/hte/idcmn.mp3', 6700000, '2021-07-30'),
('Billie Bossa Nova', 7, 8, 13, 195, 1000000, '/music/billie_eilish/hte/billie_bossa_nova.mp3', 6500000, '2021-07-30'),
('my future', 7, 8, 13, 210, 1800000, '/music/billie_eilish/hte/my_future.mp3', 7000000, '2021-07-30'),
('Oxytocin', 7, 8, 13, 180, 1300000, '/music/billie_eilish/hte/oxytocin.mp3', 6000000, '2021-07-30'),

-- The Weeknd - After Hours (R&B/Pop - GenreID 12/1)
('Alone Again', 8, 9, 12, 240, 2000000, '/music/the_weeknd/after_hours/alone_again.mp3', 8000000, '2020-03-20'),
('Too Late', 8, 9, 12, 200, 1500000, '/music/the_weeknd/after_hours/too_late.mp3', 6700000, '2020-03-20'),
('Hardest To Love', 8, 9, 12, 220, 1800000, '/music/the_weeknd/after_hours/hardest_to_love.mp3', 7300000, '2020-03-20'),
('Scared To Live', 8, 9, 12, 190, 1200000, '/music/the_weeknd/after_hours/scared_to_live.mp3', 6300000, '2020-03-20'),
('Snowchild', 8, 9, 12, 250, 1600000, '/music/the_weeknd/after_hours/snowchild.mp3', 8300000, '2020-03-20'),

-- The Weeknd - Dawn FM (R&B/Pop - GenreID 12/1)
('Gasoline', 8, 10, 12, 240, 1800000, '/music/the_weeknd/dawn_fm/gasoline.mp3', 8000000, '2022-01-07'),
('How Do I Make You Love Me?', 8, 10, 12, 200, 1500000, '/music/the_weeknd/dawn_fm/hdmylm.mp3', 6700000, '2022-01-07'),
('Take My Breath', 8, 10, 12, 220, 2000000, '/music/the_weeknd/dawn_fm/take_my_breath.mp3', 7300000, '2022-01-07'),
('Sacrifice', 8, 10, 12, 190, 1300000, '/music/the_weeknd/dawn_fm/sacrifice.mp3', 6300000, '2022-01-07'),
('Out of Time', 8, 10, 12, 210, 1700000, '/music/the_weeknd/dawn_fm/out_of_time.mp3', 7000000, '2022-01-07'),

-- Ariana Grande - Positions (R&B/Pop - GenreID 12/1)
('Shut Up', 9, 11, 1, 180, 2000000, '/music/ariana_grande/positions/shut_up.mp3', 6000000, '2020-10-30'),
('34+35', 9, 11, 1, 170, 3000000, '/music/ariana_grande/positions/34_35.mp3', 5700000, '2020-10-30'),
('Motive', 9, 11, 1, 200, 1800000, '/music/ariana_grande/positions/motive.mp3', 6700000, '2020-10-30'),
('Just Like Magic', 9, 11, 1, 190, 1500000, '/music/ariana_grande/positions/just_like_magic.mp3', 6300000, '2020-10-30'),
('Off the Table', 9, 11, 12, 240, 1200000, '/music/ariana_grande/positions/off_the_table.mp3', 8000000, '2020-10-30'),

-- Ariana Grande - Sweetener (Pop/R&B - GenreID 1/12)
('Raindrops (An Angel Cried)', 9, 12, 1, 40, 800000, '/music/ariana_grande/sweetener/raindrops.mp3', 1300000, '2018-08-17'),
('Blazed', 9, 12, 1, 180, 1200000, '/music/ariana_grande/sweetener/blazed.mp3', 6000000, '2018-08-17'),
('The Light Is Coming', 9, 12, 1, 200, 1500000, '/music/ariana_grande/sweetener/tlic.mp3', 6700000, '2018-08-17'),
('R.E.M', 9, 12, 1, 190, 1000000, '/music/ariana_grande/sweetener/rem.mp3', 6300000, '2018-08-17'),
('God is a woman', 9, 12, 1, 200, 4000000, '/music/ariana_grande/sweetener/god_is_a_woman.mp3', 6700000, '2018-08-17'),

-- Drake - Certified Lover Boy (Hip-Hop - GenreID 3)
('Champagne Poetry', 10, 13, 3, 320, 2500000, '/music/drake/clb/champagne_poetry.mp3', 10700000, '2021-09-03'),
('Papis Home', 10, 13, 3, 280, 1800000, '/music/drake/clb/papis_home.mp3', 9300000, '2021-09-03'),
('Girls Want Girls', 10, 13, 3, 240, 2200000, '/music/drake/clb/girls_want_girls.mp3', 8000000, '2021-09-03'),
('In The Bible', 10, 13, 3, 300, 1500000, '/music/drake/clb/in_the_bible.mp3', 10000000, '2021-09-03'),
('Love All', 10, 13, 3, 260, 1200000, '/music/drake/clb/love_all.mp3', 8700000, '2021-09-03'),

-- Drake - Honestly, Nevermind (Dance/House - GenreID 5/6)
('Texts Go Green', 10, 14, 5, 240, 1000000, '/music/drake/hn/texts_go_green.mp3', 8000000, '2022-06-17'),
('Currents', 10, 14, 6, 220, 800000, '/music/drake/hn/currents.mp3', 7300000, '2022-06-17'),
('A Keeper', 10, 14, 5, 200, 600000, '/music/drake/hn/a_keeper.mp3', 6700000, '2022-06-17'),
('Calling My Name', 10, 14, 6, 280, 900000, '/music/drake/hn/calling_my_name.mp3', 9300000, '2022-06-17'),
('Sticky', 10, 14, 5, 260, 700000, '/music/drake/hn/sticky.mp3', 8700000, '2022-06-17'),

-- Beyoncé - Renaissance (Dance/House - GenreID 5/6)
('IM THAT GIRL', 11, 15, 5, 180, 2000000, '/music/beyonce/renaissance/im_that_girl.mp3', 6000000, '2022-07-29'),
('COZY', 11, 15, 6, 200, 1500000, '/music/beyonce/renaissance/cozy.mp3', 6700000, '2022-07-29'),
('ALIEN SUPERSTAR', 11, 15, 5, 240, 1800000, '/music/beyonce/renaissance/alien_superstar.mp3', 8000000, '2022-07-29'),
('CUFF IT', 11, 15, 6, 220, 2500000, '/music/beyonce/renaissance/cuff_it.mp3', 7300000, '2022-07-29'),
('ENERGY', 11, 15, 5, 190, 1200000, '/music/beyonce/renaissance/energy.mp3', 6300000, '2022-07-29'),

-- Beyoncé - Lemonade (R&B/Pop - GenreID 12/1)
('Pray You Catch Me', 11, 16, 12, 200, 1500000, '/music/beyonce/lemonade/pray_you_catch_me.mp3', 6700000, '2016-04-23'),
('Hold Up', 11, 16, 1, 220, 3000000, '/music/beyonce/lemonade/hold_up.mp3', 7300000, '2016-04-23'),
('Dont Hurt Yourself', 11, 16, 12, 240, 2000000, '/music/beyonce/lemonade/dont_hurt_yourself.mp3', 8000000, '2016-04-23'),
('Sorry', 11, 16, 1, 200, 4000000, '/music/beyonce/lemonade/sorry.mp3', 6700000, '2016-04-23'),
('6 Inch', 11, 16, 12, 260, 1800000, '/music/beyonce/lemonade/6_inch.mp3', 8700000, '2016-04-23'),

-- Kendrick Lamar - DAMN. (Hip-Hop - GenreID 3)
('BLOOD.', 12, 17, 3, 120, 1000000, '/music/kendrick_lamar/damn/blood.mp3', 4000000, '2017-04-14'),
('DNA.', 12, 17, 3, 240, 5000000, '/music/kendrick_lamar/damn/dna.mp3', 8000000, '2017-04-14'),
('YAH.', 12, 17, 3, 180, 2000000, '/music/kendrick_lamar/damn/yah.mp3', 6000000, '2017-04-14'),
('ELEMENT.', 12, 17, 3, 220, 3000000, '/music/kendrick_lamar/damn/element.mp3', 7300000, '2017-04-14'),
('FEEL.', 12, 17, 3, 280, 2500000, '/music/kendrick_lamar/damn/feel.mp3', 9300000, '2017-04-14'),

-- Kendrick Lamar - Mr. Morale & The Big Steppers (Hip-Hop - GenreID 3)
('United In Grief', 12, 18, 3, 240, 1500000, '/music/kendrick_lamar/mmtbs/united_in_grief.mp3', 8000000, '2022-05-13'),
('N95', 12, 18, 3, 200, 3000000, '/music/kendrick_lamar/mmtbs/n95.mp3', 6700000, '2022-05-13'),
('Worldwide Steppers', 12, 18, 3, 260, 1200000, '/music/kendrick_lamar/mmtbs/worldwide_steppers.mp3', 8700000, '2022-05-13'),
('Die Hard', 12, 18, 3, 220, 1800000, '/music/kendrick_lamar/mmtbs/die_hard.mp3', 7300000, '2022-05-13'),
('Father Time', 12, 18, 3, 240, 2000000, '/music/kendrick_lamar/mmtbs/father_time.mp3', 8000000, '2022-05-13'),

-- Lorde - Melodrama (Alternative/Pop - GenreID 13/1)
('Green Light', 13, 19, 13, 200, 4000000, '/music/lorde/melodrama/green_light.mp3', 6700000, '2017-06-16'),
('Sober', 13, 19, 13, 240, 2000000, '/music/lorde/melodrama/sober.mp3', 8000000, '2017-06-16'),
('Homemade Dynamite', 13, 19, 13, 180, 1500000, '/music/lorde/melodrama/homemade_dynamite.mp3', 6000000, '2017-06-16'),
('The Louvre', 13, 19, 13, 220, 1200000, '/music/lorde/melodrama/the_louvre.mp3', 7300000, '2017-06-16'),
('Liability', 13, 19, 13, 260, 3000000, '/music/lorde/melodrama/liability.mp3', 8700000, '2017-06-16'),

-- Lorde - Solar Power (Folk/Pop - GenreID 14/1)
('The Path', 13, 20, 14, 240, 1000000, '/music/lorde/solar_power/the_path.mp3', 8000000, '2021-08-20'),
('Solar Power', 13, 20, 1, 200, 3000000, '/music/lorde/solar_power/solar_power.mp3', 6700000, '2021-08-20'),
('California', 13, 20, 1, 220, 1500000, '/music/lorde/solar_power/california.mp3', 7300000, '2021-08-20'),
('Stoned at the Nail Salon', 13, 20, 14, 260, 1200000, '/music/lorde/solar_power/stoned_nail_salon.mp3', 8700000, '2021-08-20'),
('Fallen Fruit', 13, 20, 1, 200, 800000, '/music/lorde/solar_power/fallen_fruit.mp3', 6700000, '2021-08-20'),

-- Frank Ocean - Blonde (Alternative R&B - GenreID 13/12)
('Nikes', 14, 21, 13, 300, 2000000, '/music/frank_ocean/blonde/nikes.mp3', 10000000, '2016-08-20'),
('Ivy', 14, 21, 12, 240, 3000000, '/music/frank_ocean/blonde/ivy.mp3', 8000000, '2016-08-20'),
('Pink + White', 14, 21, 12, 200, 2500000, '/music/frank_ocean/blonde/pink_white.mp3', 6700000, '2016-08-20'),
('Be Yourself', 14, 21, 13, 120, 800000, '/music/frank_ocean/blonde/be_yourself.mp3', 4000000, '2016-08-20'),
('Solo', 14, 21, 12, 180, 1800000, '/music/frank_ocean/blonde/solo.mp3', 6000000, '2016-08-20'),

-- Frank Ocean - Channel Orange (R&B - GenreID 12)
('Start', 14, 22, 12, 60, 500000, '/music/frank_ocean/channel_orange/start.mp3', 2000000, '2012-07-10'),
('Thinkin Bout You', 14, 22, 12, 200, 4000000, '/music/frank_ocean/channel_orange/thinkin_bout_you.mp3', 6700000, '2012-07-10'),
('Fertilizer', 14, 22, 12, 40, 300000, '/music/frank_ocean/channel_orange/fertilizer.mp3', 1300000, '2012-07-10'),
('Sierra Leone', 14, 22, 12, 180, 800000, '/music/frank_ocean/channel_orange/sierra_leone.mp3', 6000000, '2012-07-10'),
('Sweet Life', 14, 22, 12, 240, 1500000, '/music/frank_ocean/channel_orange/sweet_life.mp3', 8000000, '2012-07-10'),

-- Adele - 30 (Pop - GenreID 1)
('Easy On Me', 15, 23, 1, 366, 4500000, '/music/adele/30/eom.mp3', 12000000, '2021-11-19'),
('Oh My God', 15, 23, 1, 245, 3200000, '/music/adele/30/omg.mp3', 8200000, '2021-11-19'),
('I Drink Wine', 15, 23, 1, 280, 2800000, '/music/adele/30/idw.mp3', 9400000, '2021-11-19'),
('My Little Love', 15, 23, 1, 240, 2000000, '/music/adele/30/mll.mp3', 8000000, '2021-11-19'),
('Cry Your Heart Out', 15, 23, 1, 200, 1500000, '/music/adele/30/cyho.mp3', 6700000, '2021-11-19'),

-- Adele - 25 (Pop - GenreID 1)
('Hello', 15, 24, 1, 295, 8000000, '/music/adele/25/hello.mp3', 9900000, '2015-11-20'),
('When We Were Young', 15, 24, 1, 245, 3500000, '/music/adele/25/wwwy.mp3', 8200000, '2015-11-20'),
('Send My Love', 15, 24, 1, 270, 3000000, '/music/adele/25/sml.mp3', 9000000, '2015-11-20'),
('Water Under the Bridge', 15, 24, 1, 240, 2000000, '/music/adele/25/wutb.mp3', 8000000, '2015-11-20'),
('Million Years Ago', 15, 24, 1, 220, 1800000, '/music/adele/25/mya.mp3', 7300000, '2015-11-20'),

-- Bruno Mars - 24K Magic (Funk/Pop - GenreID 1)
('24K Magic', 16, 25, 1, 210, 6000000, '/music/bruno_mars/24k/24k.mp3', 7000000, '2016-11-18'),
('Thats What I Like', 16, 25, 1, 240, 5500000, '/music/bruno_mars/24k/twil.mp3', 8000000, '2016-11-18'),
('Versace on the Floor', 16, 25, 1, 195, 4000000, '/music/bruno_mars/24k/votf.mp3', 6500000, '2016-11-18'),
('Chunky', 16, 25, 1, 200, 2500000, '/music/bruno_mars/24k/chunky.mp3', 6700000, '2016-11-18'),
('Perm', 16, 25, 1, 180, 2000000, '/music/bruno_mars/24k/perm.mp3', 6000000, '2016-11-18'),

-- Bruno Mars - Unorthodox Jukebox (Pop/Funk - GenreID 1)
('Young Girls', 16, 26, 1, 240, 2000000, '/music/bruno_mars/uj/young_girls.mp3', 8000000, '2012-12-07'),
('Locked Out of Heaven', 16, 26, 1, 200, 5000000, '/music/bruno_mars/uj/locked_out.mp3', 6700000, '2012-12-07'),
('Gorilla', 16, 26, 1, 240, 1500000, '/music/bruno_mars/uj/gorilla.mp3', 8000000, '2012-12-07'),
('Treasure', 16, 26, 1, 180, 3000000, '/music/bruno_mars/uj/treasure.mp3', 6000000, '2012-12-07'),
('Moonshine', 16, 26, 1, 220, 1200000, '/music/bruno_mars/uj/moonshine.mp3', 7300000, '2012-12-07'),

-- Dua Lipa - Future Nostalgia (Disco/Pop - GenreID 1)
('Dont Start Now', 17, 27, 1, 200, 7000000, '/music/dua_lipa/fn/dsn.mp3', 6700000, '2020-03-27'),
('Physical', 17, 27, 1, 195, 4500000, '/music/dua_lipa/fn/physical.mp3', 6500000, '2020-03-27'),
('Levitating', 17, 27, 1, 220, 6500000, '/music/dua_lipa/fn/levitating.mp3', 7300000, '2020-03-27'),
('Break My Heart', 17, 27, 1, 200, 5000000, '/music/dua_lipa/fn/bmh.mp3', 6700000, '2020-03-27'),
('Hallucinate', 17, 27, 1, 180, 3000000, '/music/dua_lipa/fn/hallucinate.mp3', 6000000, '2020-03-27'),

-- Dua Lipa - Dua Lipa (Pop - GenreID 1)
('New Rules', 17, 28, 1, 200, 8000000, '/music/dua_lipa/dl/new_rules.mp3', 6700000, '2017-06-02'),
('IDGAF', 17, 28, 1, 180, 6000000, '/music/dua_lipa/dl/idgaf.mp3', 6000000, '2017-06-02'),
('Blow Your Mind (Mwah)', 17, 28, 1, 200, 3000000, '/music/dua_lipa/dl/bym.mp3', 6700000, '2017-06-02'),
('Be the One', 17, 28, 1, 240, 2500000, '/music/dua_lipa/dl/bto.mp3', 8000000, '2017-06-02'),
('Hotter than Hell', 17, 28, 1, 200, 2000000, '/music/dua_lipa/dl/hth.mp3', 6700000, '2017-06-02'),

-- Harry Styles - Harry's House (Indie Pop - GenreID 1)
('Music For a Sushi Restaurant', 18, 29, 1, 240, 3500000, '/music/harry_styles/hh/mfasr.mp3', 8000000, '2022-05-20'),
('Late Night Talking', 18, 29, 1, 200, 4500000, '/music/harry_styles/hh/lnt.mp3', 6700000, '2022-05-20'),
('Grapejuice', 18, 29, 1, 220, 2000000, '/music/harry_styles/hh/grapejuice.mp3', 7300000, '2022-05-20'),
('As It Was', 18, 29, 1, 180, 8000000, '/music/harry_styles/hh/aiw.mp3', 6000000, '2022-05-20'),
('Daylight', 18, 29, 1, 200, 3000000, '/music/harry_styles/hh/daylight.mp3', 6700000, '2022-05-20'),

-- Harry Styles - Fine Line (Pop - GenreID 1)
('Golden', 18, 30, 1, 200, 4000000, '/music/harry_styles/fl/golden.mp3', 6700000, '2019-12-13'),
('Watermelon Sugar', 18, 30, 1, 180, 6000000, '/music/harry_styles/fl/ws.mp3', 6000000, '2019-12-13'),
('Adore You', 18, 30, 1, 240, 5000000, '/music/harry_styles/fl/ay.mp3', 8000000, '2019-12-13'),
('Lights Up', 18, 30, 1, 200, 3000000, '/music/harry_styles/fl/lu.mp3', 6700000, '2019-12-13'),
('Cherry', 18, 30, 1, 220, 2000000, '/music/harry_styles/fl/cherry.mp3', 7300000, '2019-12-13'),

-- Olivia Rodrigo - Sour (Pop-Punk/Pop - GenreID 2/1)
('brutal', 19, 31, 2, 180, 2000000, '/music/olivia_rodrigo/sour/brutal.mp3', 6000000, '2021-05-21'),
('traitor', 19, 31, 1, 200, 3000000, '/music/olivia_rodrigo/sour/traitor.mp3', 6700000, '2021-05-21'),
('drivers license', 19, 31, 1, 195, 9000000, '/music/olivia_rodrigo/sour/dl.mp3', 6500000, '2021-05-21'),
('1 step forward, 3 steps back', 19, 31, 1, 180, 1500000, '/music/olivia_rodrigo/sour/1sf3sb.mp3', 6000000, '2021-05-21'),
('deja vu', 19, 31, 1, 200, 5000000, '/music/olivia_rodrigo/sour/dv.mp3', 6700000, '2021-05-21'),

-- Olivia Rodrigo - Guts (Rock/Pop - GenreID 2/1)
('all-american bitch', 19, 32, 2, 180, 2000000, '/music/olivia_rodrigo/guts/aab.mp3', 6000000, '2023-09-08'),
('bad idea right?', 19, 32, 2, 200, 3000000, '/music/olivia_rodrigo/guts/bir.mp3', 6700000, '2023-09-08'),
('vampire', 19, 32, 1, 240, 4000000, '/music/olivia_rodrigo/guts/vampire.mp3', 8000000, '2023-09-08'),
('lacy', 19, 32, 1, 200, 1500000, '/music/olivia_rodrigo/guts/lacy.mp3', 6700000, '2023-09-08'),
('ballad of a homeschooled girl', 19, 32, 1, 220, 1200000, '/music/olivia_rodrigo/guts/boahg.mp3', 7300000, '2023-09-08'),

-- The Beatles - Abbey Road (Rock - GenreID 2)
('Come Together', 20, 33, 2, 260, 8000000, '/music/beatles/abbey_road/come_together.mp3', 8700000, '1969-09-26'),
('Something', 20, 33, 2, 180, 6000000, '/music/beatles/abbey_road/something.mp3', 6000000, '1969-09-26'),
('Maxwells Silver Hammer', 20, 33, 2, 200, 3000000, '/music/beatles/abbey_road/msh.mp3', 6700000, '1969-09-26'),
('Oh! Darling', 20, 33, 2, 220, 4000000, '/music/beatles/abbey_road/oh_darling.mp3', 7300000, '1969-09-26'),
('Here Comes the Sun', 20, 33, 2, 180, 7000000, '/music/beatles/abbey_road/hcts.mp3', 6000000, '1969-09-26'),

-- The Beatles - Sgt. Pepper's (Rock - GenreID 2)
('Sgt. Peppers Lonely Hearts Club Band', 20, 34, 2, 120, 2000000, '/music/beatles/sgt_peppers/sgt_peppers.mp3', 4000000, '1967-06-01'),
('With a Little Help from My Friends', 20, 34, 2, 180, 5000000, '/music/beatles/sgt_peppers/walhfmy.mp3', 6000000, '1967-06-01'),
('Lucy in the Sky with Diamonds', 20, 34, 2, 240, 6000000, '/music/beatles/sgt_peppers/litswd.mp3', 8000000, '1967-06-01'),
('Getting Better', 20, 34, 2, 160, 2000000, '/music/beatles/sgt_peppers/getting_better.mp3', 5300000, '1967-06-01'),
('Fixing a Hole', 20, 34, 2, 200, 1500000, '/music/beatles/sgt_peppers/fah.mp3', 6700000, '1967-06-01'),

-- Queen - A Night at the Opera (Rock - GenreID 2)
('Death on Two Legs', 21, 35, 2, 220, 1000000, '/music/queen/night_opera/dotl.mp3', 7300000, '1975-11-21'),
('Lazing on a Sunday Afternoon', 21, 35, 2, 60, 500000, '/music/queen/night_opera/losa.mp3', 2000000, '1975-11-21'),
('Im in Love with My Car', 21, 35, 2, 180, 800000, '/music/queen/night_opera/iilwmc.mp3', 6000000, '1975-11-21'),
('Youre My Best Friend', 21, 35, 2, 160, 3000000, '/music/queen/night_opera/ymbf.mp3', 5300000, '1975-11-21'),
('Bohemian Rhapsody', 21, 35, 2, 355, 12000000, '/music/queen/night_opera/bohemian_rhapsody.mp3', 12000000, '1975-11-21'),

-- Queen - News of the World (Rock - GenreID 2)
('We Will Rock You', 21, 36, 2, 120, 10000000, '/music/queen/news_world/wwry.mp3', 4000000, '1977-10-28'),
('We Are the Champions', 21, 36, 2, 180, 15000000, '/music/queen/news_world/watc.mp3', 6000000, '1977-10-28'),
('Sheer Heart Attack', 21, 36, 2, 200, 2000000, '/music/queen/news_world/sha.mp3', 6700000, '1977-10-28'),
('All Dead, All Dead', 21, 36, 2, 180, 500000, '/music/queen/news_world/adad.mp3', 6000000, '1977-10-28'),
('Spread Your Wings', 21, 36, 2, 240, 1000000, '/music/queen/news_world/syw.mp3', 8000000, '1977-10-28'),

-- Led Zeppelin - Led Zeppelin IV (Rock - GenreID 2)
('Black Dog', 22, 37, 2, 300, 5000000, '/music/led_zeppelin/zeppelin4/black_dog.mp3', 10000000, '1971-11-08'),
('Rock and Roll', 22, 37, 2, 220, 4000000, '/music/led_zeppelin/zeppelin4/rock_roll.mp3', 7300000, '1971-11-08'),
('The Battle of Evermore', 22, 37, 2, 360, 2000000, '/music/led_zeppelin/zeppelin4/tboe.mp3', 12000000, '1971-11-08'),
('Stairway to Heaven', 22, 37, 2, 482, 15000000, '/music/led_zeppelin/zeppelin4/stairway_heaven.mp3', 16000000, '1971-11-08'),
('Misty Mountain Hop', 22, 37, 2, 280, 3000000, '/music/led_zeppelin/zeppelin4/mmh.mp3', 9300000, '1971-11-08'),

-- Led Zeppelin - Physical Graffiti (Rock - GenreID 2)
('Custard Pie', 22, 38, 2, 240, 1000000, '/music/led_zeppelin/physical_graffiti/custard_pie.mp3', 8000000, '1975-02-24'),
('The Rover', 22, 38, 2, 300, 1500000, '/music/led_zeppelin/physical_graffiti/the_rover.mp3', 10000000, '1975-02-24'),
('In My Time of Dying', 22, 38, 2, 420, 2000000, '/music/led_zeppelin/physical_graffiti/imtod.mp3', 14000000, '1975-02-24'),
('Houses of the Holy', 22, 38, 2, 240, 3000000, '/music/led_zeppelin/physical_graffiti/hoth.mp3', 8000000, '1975-02-24'),
('Trampled Under Foot', 22, 38, 2, 300, 2500000, '/music/led_zeppelin/physical_graffiti/tuf.mp3', 10000000, '1975-02-24'),

-- Pink Floyd - The Dark Side of the Moon (Progressive Rock - GenreID 2)
('Speak to Me', 23, 39, 2, 60, 500000, '/music/pink_floyd/dark_side/stm.mp3', 2000000, '1973-03-01'),
('Breathe', 23, 39, 2, 180, 2000000, '/music/pink_floyd/dark_side/breathe.mp3', 6000000, '1973-03-01'),
('On the Run', 23, 39, 2, 200, 1500000, '/music/pink_floyd/dark_side/otr.mp3', 6700000, '1973-03-01'),
('Time', 23, 39, 2, 420, 5000000, '/music/pink_floyd/dark_side/time.mp3', 14000000, '1973-03-01'),
('The Great Gig in the Sky', 23, 39, 2, 280, 3000000, '/music/pink_floyd/dark_side/tggits.mp3', 9300000, '1973-03-01'),

-- Pink Floyd - The Wall (Progressive Rock - GenreID 2)
('In the Flesh?', 23, 40, 2, 200, 1000000, '/music/pink_floyd/wall/itf.mp3', 6700000, '1979-11-30'),
('The Thin Ice', 23, 40, 2, 120, 800000, '/music/pink_floyd/wall/tti.mp3', 4000000, '1979-11-30'),
('Another Brick in the Wall, Part 1', 23, 40, 2, 180, 2000000, '/music/pink_floyd/wall/abitw1.mp3', 6000000, '1979-11-30'),
('The Happiest Days of Our Lives', 23, 40, 2, 120, 500000, '/music/pink_floyd/wall/thdoo.mp3', 4000000, '1979-11-30'),
('Another Brick in the Wall, Part 2', 23, 40, 2, 240, 8000000, '/music/pink_floyd/wall/abitw2.mp3', 8000000, '1979-11-30'),

-- Nirvana - Nevermind (Grunge - GenreID 2)
('Smells Like Teen Spirit', 24, 41, 2, 301, 18000000, '/music/nirvana/nevermind/teen_spirit.mp3', 10000000, '1991-09-24'),
('In Bloom', 24, 41, 2, 240, 3000000, '/music/nirvana/nevermind/in_bloom.mp3', 8000000, '1991-09-24'),
('Come as You Are', 24, 41, 2, 220, 5000000, '/music/nirvana/nevermind/caya.mp3', 7300000, '1991-09-24'),
('Breed', 24, 41, 2, 180, 2000000, '/music/nirvana/nevermind/breed.mp3', 6000000, '1991-09-24'),
('Lithium', 24, 41, 2, 260, 4000000, '/music/nirvana/nevermind/lithium.mp3', 8700000, '1991-09-24'),

-- Nirvana - In Utero (Grunge - GenreID 2)
('Serve the Servants', 24, 42, 2, 200, 1000000, '/music/nirvana/in_utero/sts.mp3', 6700000, '1993-09-21'),
('Scentless Apprentice', 24, 42, 2, 240, 800000, '/music/nirvana/in_utero/sa.mp3', 8000000, '1993-09-21'),
('Heart-Shaped Box', 24, 42, 2, 280, 4000000, '/music/nirvana/in_utero/hsb.mp3', 9300000, '1993-09-21'),
('Rape Me', 24, 42, 2, 180, 1500000, '/music/nirvana/in_utero/rm.mp3', 6000000, '1993-09-21'),
('Frances Farmer Will Have Her Revenge on Seattle', 24, 42, 2, 240, 1200000, '/music/nirvana/in_utero/ffwhr.mp3', 8000000, '1993-09-21'),

-- Metallica - Master of Puppets (Metal - GenreID 16)
('Battery', 25, 43, 16, 300, 2000000, '/music/metallica/mop/battery.mp3', 10000000, '1986-03-03'),
('Master of Puppets', 25, 43, 16, 515, 8000000, '/music/metallica/mop/master_puppets.mp3', 17200000, '1986-03-03'),
('The Thing That Should Not Be', 25, 43, 16, 400, 1500000, '/music/metallica/mop/tttsnb.mp3', 13300000, '1986-03-03'),
('Welcome Home (Sanitarium)', 25, 43, 16, 380, 3000000, '/music/metallica/mop/whs.mp3', 12700000, '1986-03-03'),
('Disposable Heroes', 25, 43, 16, 480, 1800000, '/music/metallica/mop/dh.mp3', 16000000, '1986-03-03'),

-- Metallica - Black Album (Metal - GenreID 16)
('Enter Sandman', 25, 44, 16, 331, 12000000, '/music/metallica/black_album/enter_sandman.mp3', 11000000, '1991-08-12'),
('Sad But True', 25, 44, 16, 320, 4000000, '/music/metallica/black_album/sbt.mp3', 10700000, '1991-08-12'),
('Holier Than Thou', 25, 44, 16, 240, 2000000, '/music/metallica/black_album/htt.mp3', 8000000, '1991-08-12'),
('The Unforgiven', 25, 44, 16, 380, 6000000, '/music/metallica/black_album/tu.mp3', 12700000, '1991-08-12'),
('Wherever I May Roam', 25, 44, 16, 400, 3000000, '/music/metallica/black_album/wimr.mp3', 13300000, '1991-08-12'),

-- Skrillex - Scary Monsters and Nice Sprites (Dubstep - GenreID 7)
('Rock N Roll (Will Take You to the Mountain)', 26, 45, 7, 240, 2000000, '/music/skrillex/smns/rnr.mp3', 8000000, '2010-10-22'),
('Scary Monsters and Nice Sprites', 26, 45, 7, 180, 8000000, '/music/skrillex/smns/scary_monsters.mp3', 6000000, '2010-10-22'),
('Kill EVERYBODY', 26, 45, 7, 200, 3000000, '/music/skrillex/smns/ke.mp3', 6700000, '2010-10-22'),
('Scatta', 26, 45, 7, 180, 1500000, '/music/skrillex/smns/scatta.mp3', 6000000, '2010-10-22'),
('With You, Friends (Long Drive)', 26, 45, 7, 360, 1000000, '/music/skrillex/smns/wyf.mp3', 12000000, '2010-10-22'),

-- Skrillex - Bangarang (Dubstep - GenreID 7)
('Right In', 26, 46, 7, 120, 1000000, '/music/skrillex/bangarang/right_in.mp3', 4000000, '2011-12-23'),
('Bangarang', 26, 46, 7, 204, 6000000, '/music/skrillex/bangarang/bangarang.mp3', 6800000, '2011-12-23'),
('Breakn a Sweat', 26, 46, 7, 240, 2000000, '/music/skrillex/bangarang/bas.mp3', 8000000, '2011-12-23'),
('The Devils Den', 26, 46, 7, 200, 1500000, '/music/skrillex/bangarang/tdd.mp3', 6700000, '2011-12-23'),
('Right On Time', 26, 46, 7, 180, 1200000, '/music/skrillex/bangarang/rot.mp3', 6000000, '2011-12-23'),

-- Deadmau5 - 4x4=12 (House - GenreID 6)
('Some Chords', 27, 47, 6, 420, 2000000, '/music/deadmau5/4x4/some_chords.mp3', 14000000, '2010-12-06'),
('Sofi Needs a Ladder', 27, 47, 6, 300, 1500000, '/music/deadmau5/4x4/snal.mp3', 10000000, '2010-12-06'),
('A City in Florida', 27, 47, 6, 360, 1000000, '/music/deadmau5/4x4/acif.mp3', 12000000, '2010-12-06'),
('Bad Selection', 27, 47, 6, 240, 800000, '/music/deadmau5/4x4/bs.mp3', 8000000, '2010-12-06'),
('Animal Rights', 27, 47, 6, 300, 1200000, '/music/deadmau5/4x4/ar.mp3', 10000000, '2010-12-06'),

-- Deadmau5 - While(1<2) (House/Ambient - GenreID 6/15)
('Avaritia', 27, 48, 6, 360, 1500000, '/music/deadmau5/while/avaritia.mp3', 12000000, '2014-06-17'),
('Coelacanth I', 27, 48, 15, 240, 800000, '/music/deadmau5/while/coelacanth1.mp3', 8000000, '2014-06-17'),
('Ice Age', 27, 48, 6, 300, 1000000, '/music/deadmau5/while/ice_age.mp3', 10000000, '2014-06-17'),
('My Pet Coelacanth', 27, 48, 15, 180, 600000, '/music/deadmau5/while/mpc.mp3', 6000000, '2014-06-17'),
('Infra Turbo Pigcart Racer', 27, 48, 6, 420, 1200000, '/music/deadmau5/while/itpr.mp3', 14000000, '2014-06-17'),

-- Bob Marley - Exodus (Reggae - GenreID 17)
('Natural Mystic', 28, 49, 17, 180, 2000000, '/music/bob_marley/exodus/natural_mystic.mp3', 6000000, '1977-06-03'),
('So Much Things to Say', 28, 49, 17, 200, 1500000, '/music/bob_marley/exodus/smts.mp3', 6700000, '1977-06-03'),
('Guiltiness', 28, 49, 17, 240, 1000000, '/music/bob_marley/exodus/guiltiness.mp3', 8000000, '1977-06-03'),
('The Heathen', 28, 49, 17, 180, 800000, '/music/bob_marley/exodus/the_heathen.mp3', 6000000, '1977-06-03'),
('Exodus', 28, 49, 17, 420, 3000000, '/music/bob_marley/exodus/exodus.mp3', 14000000, '1977-06-03'),

-- Bob Marley - Legend (Reggae - GenreID 17)
('Is This Love', 28, 50, 17, 240, 4000000, '/music/bob_marley/legend/is_this_love.mp3', 8000000, '1984-05-08'),
('No Woman, No Cry', 28, 50, 17, 420, 3500000, '/music/bob_marley/legend/no_woman.mp3', 14000000, '1984-05-08'),
('Could You Be Loved', 28, 50, 17, 200, 3000000, '/music/bob_marley/legend/cybl.mp3', 6700000, '1984-05-08'),
('Three Little Birds', 28, 50, 17, 180, 4000000, '/music/bob_marley/legend/three_birds.mp3', 6000000, '1984-05-08'),
('Buffalo Soldier', 28, 50, 17, 240, 2500000, '/music/bob_marley/legend/buffalo_soldier.mp3', 8000000, '1984-05-08'),

-- Mozart - Symphony No. 40 (Classical - GenreID 10)
('Symphony No. 40 in G Minor - I. Molto allegro', 29, 51, 10, 480, 500000, '/music/mozart/symphony40/mvt1.mp3', 16000000, '1788-07-25'),
('Symphony No. 40 in G Minor - II. Andante', 29, 51, 10, 360, 300000, '/music/mozart/symphony40/mvt2.mp3', 12000000, '1788-07-25'),
('Symphony No. 40 in G Minor - III. Menuetto. Allegretto', 29, 51, 10, 240, 200000, '/music/mozart/symphony40/mvt3.mp3', 8000000, '1788-07-25'),
('Symphony No. 40 in G Minor - IV. Finale. Allegro assai', 29, 51, 10, 300, 400000, '/music/mozart/symphony40/mvt4.mp3', 10000000, '1788-07-25'),
('Eine kleine Nachtmusik - I. Allegro', 29, 51, 10, 300, 600000, '/music/mozart/symphony40/nachtmusik1.mp3', 10000000, '1788-07-25'),

-- Mozart - The Magic Flute (Classical - GenreID 10)
('Overture', 29, 52, 10, 420, 800000, '/music/mozart/magic_flute/overture.mp3', 14000000, '1791-09-30'),
('Der Vogelfänger bin ich ja', 29, 52, 10, 180, 300000, '/music/mozart/magic_flute/vogelfanger.mp3', 6000000, '1791-09-30'),
('Dies Bildnis ist bezaubernd schön', 29, 52, 10, 240, 400000, '/music/mozart/magic_flute/dies_bildnis.mp3', 8000000, '1791-09-30'),
('Der Hölle Rache kocht in meinem Herzen', 29, 52, 10, 180, 500000, '/music/mozart/magic_flute/helle_rache.mp3', 6000000, '1791-09-30'),
('Ach, ich fühls, es ist verschwunden', 29, 52, 10, 200, 350000, '/music/mozart/magic_flute/ach_ich_fuhls.mp3', 6700000, '1791-09-30'),

-- Bob Dylan - Highway 61 Revisited (Folk - GenreID 14)
('Like a Rolling Stone', 30, 53, 14, 365, 6000000, '/music/bob_dylan/highway61/rolling_stone.mp3', 12200000, '1965-08-30'),
('Tombstone Blues', 30, 53, 14, 300, 2000000, '/music/bob_dylan/highway61/tombstone_blues.mp3', 10000000, '1965-08-30'),
('It Takes a Lot to Laugh, It Takes a Train to Cry', 30, 53, 14, 240, 1500000, '/music/bob_dylan/highway61/italt.mp3', 8000000, '1965-08-30'),
('From a Buick 6', 30, 53, 14, 180, 1000000, '/music/bob_dylan/highway61/fab6.mp3', 6000000, '1965-08-30'),
('Ballad of a Thin Man', 30, 53, 14, 360, 3000000, '/music/bob_dylan/highway61/boatm.mp3', 12000000, '1965-08-30'),

-- Bob Dylan - Blood on the Tracks (Folk - GenreID 14)
('Tangled Up in Blue', 30, 54, 14, 369, 4000000, '/music/bob_dylan/blood_tracks/tangled_blue.mp3', 12300000, '1975-01-17'),
('Simple Twist of Fate', 30, 54, 14, 240, 2000000, '/music/bob_dylan/blood_tracks/stof.mp3', 8000000, '1975-01-17'),
('Youre a Big Girl Now', 30, 54, 14, 300, 1500000, '/music/bob_dylan/blood_tracks/yabgn.mp3', 10000000, '1975-01-17'),
('Idiot Wind', 30, 54, 14, 420, 2500000, '/music/bob_dylan/blood_tracks/idiot_wind.mp3', 14000000, '1975-01-17'),
('Youre Gonna Make Me Lonesome When You Go', 30, 54, 14, 180, 1200000, '/music/bob_dylan/blood_tracks/ygmmlwyg.mp3', 6000000, '1975-01-17'),

-- Brian Eno - Music for Airports (Ambient - GenreID 15)
('1/1', 31, 55, 15, 1200, 800000, '/music/brian_eno/airports/1_1.mp3', 40000000, '1978-01-01'),
('1/2', 31, 55, 15, 600, 400000, '/music/brian_eno/airports/1_2.mp3', 20000000, '1978-01-01'),
('2/1', 31, 55, 15, 600, 600000, '/music/brian_eno/airports/2_1.mp3', 20000000, '1978-01-01'),
('2/2', 31, 55, 15, 900, 300000, '/music/brian_eno/airports/2_2.mp3', 30000000, '1978-01-01'),
('An Ending (Ascent)', 31, 55, 15, 240, 500000, '/music/brian_eno/airports/an_ending.mp3', 8000000, '1978-01-01'),

-- Brian Eno - Another Green World (Ambient - GenreID 15)
('Sky Saw', 31, 56, 15, 180, 200000, '/music/brian_eno/green_world/sky_saw.mp3', 6000000, '1975-09-01'),
('Over Fire Island', 31, 56, 15, 120, 150000, '/music/brian_eno/green_world/ofi.mp3', 4000000, '1975-09-01'),
('St. Elmos Fire', 31, 56, 15, 200, 300000, '/music/brian_eno/green_world/st_elmos_fire.mp3', 6700000, '1975-09-01'),
('In Dark Trees', 31, 56, 15, 120, 100000, '/music/brian_eno/green_world/idt.mp3', 4000000, '1975-09-01'),
('The Big Ship', 31, 56, 15, 180, 250000, '/music/brian_eno/green_world/tbs.mp3', 6000000, '1975-09-01'),

-- Johnny Cash - At Folsom Prison (Country - GenreID 11)
('Folsom Prison Blues', 32, 57, 11, 168, 2500000, '/music/johnny_cash/folsom/folsom_blues.mp3', 5600000, '1968-05-06'),
('Dark as a Dungeon', 32, 57, 11, 180, 800000, '/music/johnny_cash/folsom/daad.mp3', 6000000, '1968-05-06'),
('Cocaine Blues', 32, 57, 11, 200, 1200000, '/music/johnny_cash/folsom/cocaine_blues.mp3', 6700000, '1968-05-06'),
('25 Minutes to Go', 32, 57, 11, 240, 600000, '/music/johnny_cash/folsom/25mtg.mp3', 8000000, '1968-05-06'),
('Orange Blossom Special', 32, 57, 11, 300, 1000000, '/music/johnny_cash/folsom/obs.mp3', 10000000, '1968-05-06'),

-- Johnny Cash - American IV (Country - GenreID 11)
('The Man Comes Around', 32, 58, 11, 240, 2000000, '/music/johnny_cash/american4/tmca.mp3', 8000000, '2002-11-05'),
('Hurt', 32, 58, 11, 220, 5000000, '/music/johnny_cash/american4/hurt.mp3', 7300000, '2002-11-05'),
('Give My Love to Rose', 32, 58, 11, 180, 800000, '/music/johnny_cash/american4/gmltr.mp3', 6000000, '2002-11-05'),
('Bridge Over Troubled Water', 32, 58, 11, 300, 1200000, '/music/johnny_cash/american4/botw.mp3', 10000000, '2002-11-05'),
('Im So Lonesome I Could Cry', 32, 58, 11, 200, 1000000, '/music/johnny_cash/american4/islic.mp3', 6700000, '2002-11-05')

-- Aretha Franklin - I Never Loved a Man (R&B/Soul - GenreID 12)
('Respect', 33, 59, 12, 147, 5000000, '/music/aretha_franklin/never_loved/respect.mp3', 4900000, '1967-03-10'),
('Drown in My Own Tears', 33, 59, 12, 240, 800000, '/music/aretha_franklin/never_loved/dimot.mp3', 8000000, '1967-03-10'),
('I Never Loved a Man (The Way I Love You)', 33, 59, 12, 180, 1200000, '/music/aretha_franklin/never_loved/inlam.mp3', 6000000, '1967-03-10'),
('Soul Serenade', 33, 59, 12, 200, 600000, '/music/aretha_franklin/never_loved/soul_serenade.mp3', 6700000, '1967-03-10'),
('Dont Let Me Lose This Dream', 33, 59, 12, 160, 400000, '/music/aretha_franklin/never_loved/dlmltd.mp3', 5300000, '1967-03-10'),

-- Aretha Franklin - Amazing Grace (Gospel - GenreID 12)
('Amazing Grace', 33, 60, 12, 300, 3000000, '/music/aretha_franklin/amazing_grace/amazing_grace.mp3', 10000000, '1972-06-01'),
('How I Got Over', 33, 60, 12, 240, 800000, '/music/aretha_franklin/amazing_grace/higo.mp3', 8000000, '1972-06-01'),
('What a Friend We Have in Jesus', 33, 60, 12, 200, 600000, '/music/aretha_franklin/amazing_grace/wafwhij.mp3', 6700000, '1972-06-01'),
('Precious Lord, Take My Hand', 33, 60, 12, 180, 500000, '/music/aretha_franklin/amazing_grace/pltmh.mp3', 6000000, '1972-06-01'),
('Youll Never Walk Alone', 33, 60, 12, 220, 700000, '/music/aretha_franklin/amazing_grace/ynwa.mp3', 7300000, '1972-06-01'),

-- Radiohead - OK Computer (Alternative Rock - GenreID 13)
('Airbag', 34, 61, 13, 240, 2000000, '/music/radiohead/ok_computer/airbag.mp3', 8000000, '1997-05-21'),
('Paranoid Android', 34, 61, 13, 396, 4000000, '/music/radiohead/ok_computer/paranoid_android.mp3', 13200000, '1997-05-21'),
('Subterranean Homesick Alien', 34, 61, 13, 300, 1500000, '/music/radiohead/ok_computer/sha.mp3', 10000000, '1997-05-21'),
('Exit Music (For a Film)', 34, 61, 13, 240, 2500000, '/music/radiohead/ok_computer/em.mp3', 8000000, '1997-05-21'),
('Let Down', 34, 61, 13, 300, 3000000, '/music/radiohead/ok_computer/let_down.mp3', 10000000, '1997-05-21'),

-- Radiohead - Kid A (Alternative/Electronic - GenreID 13/4)
('Everything in Its Right Place', 34, 62, 13, 248, 3000000, '/music/radiohead/kid_a/everything_right.mp3', 8300000, '2000-10-02'),
('Kid A', 34, 62, 4, 240, 2000000, '/music/radiohead/kid_a/kid_a.mp3', 8000000, '2000-10-02'),
('The National Anthem', 34, 62, 13, 300, 2500000, '/music/radiohead/kid_a/tna.mp3', 10000000, '2000-10-02'),
('How to Disappear Completely', 34, 62, 13, 360, 4000000, '/music/radiohead/kid_a/htdc.mp3', 12000000, '2000-10-02'),
('Treefingers', 34, 62, 4, 240, 800000, '/music/radiohead/kid_a/treefingers.mp3', 8000000, '2000-10-02'),

-- David Bowie - Ziggy Stardust (Glam Rock - GenreID 2)
('Five Years', 35, 63, 2, 300, 2000000, '/music/david_bowie/ziggy/five_years.mp3', 10000000, '1972-06-16'),
('Soul Love', 35, 63, 2, 180, 800000, '/music/david_bowie/ziggy/soul_love.mp3', 6000000, '1972-06-16'),
('Moonage Daydream', 35, 63, 2, 300, 3000000, '/music/david_bowie/ziggy/moonage_daydream.mp3', 10000000, '1972-06-16'),
('Starman', 35, 63, 2, 240, 5000000, '/music/david_bowie/ziggy/starman.mp3', 8000000, '1972-06-16'),
('It Aint Easy', 35, 63, 2, 180, 600000, '/music/david_bowie/ziggy/iae.mp3', 6000000, '1972-06-16'),

-- David Bowie - Heroes (Art Rock - GenreID 2)
('Beauty and the Beast', 35, 64, 2, 200, 1000000, '/music/david_bowie/heroes/batb.mp3', 6700000, '1977-10-14'),
('Joe the Lion', 35, 64, 2, 180, 800000, '/music/david_bowie/heroes/jtl.mp3', 6000000, '1977-10-14'),
('Heroes', 35, 64, 2, 240, 8000000, '/music/david_bowie/heroes/heroes.mp3', 8000000, '1977-10-14'),
('Sons of the Silent Age', 35, 64, 2, 200, 600000, '/music/david_bowie/heroes/sotsa.mp3', 6700000, '1977-10-14'),
('Blackout', 35, 64, 2, 300, 1200000, '/music/david_bowie/heroes/blackout.mp3', 10000000, '1977-10-14');

-- Insert Playlists (PlaylistIDs 1-50)
INSERT INTO playlist (UserID, PlaylistName, Description, IsPublic, CreatedAt) VALUES
-- User 36 (Emma Smith) playlists
(36, 'My Favorites', 'Personal collection of favorite songs', 0, '2023-01-15 10:30:00'),
(36, 'Workout Mix', 'High-energy songs for exercise', 1, '2023-02-15 14:20:00'),
(36, 'Chill Vibes', 'Relaxing music for downtime', 1, '2023-03-10 19:45:00'),

-- User 37 (Michael Thompson) playlists
(37, 'Road Trip', 'Songs for long drives', 1, '2023-01-20 08:15:00'),
(37, 'Party Time', 'Upbeat tracks for celebrations', 1, '2023-02-28 20:30:00'),
(37, 'Study Music', 'Instrumental and ambient tracks', 0, '2023-03-05 16:00:00'),

-- User 38 (Sarah Johnson) playlists
(38, 'Throwback Hits', 'Classic songs from the past', 1, '2023-01-25 12:00:00'),
(38, 'New Discoveries', 'Recently found artists and songs', 1, '2023-02-10 18:30:00'),
(38, 'Rainy Day', 'Moody and introspective music', 0, '2023-03-15 11:45:00'),

-- User 39 (David Rodriguez) playlists
(39, 'Latin Vibes', 'Spanish and Latin American music', 1, '2023-01-30 15:20:00'),
(39, 'Rock Classics', 'Timeless rock anthems', 1, '2023-02-20 09:10:00'),
(39, 'Late Night', 'Smooth tracks for evening listening', 0, '2023-03-20 22:00:00'),

-- User 40 (Lisa Chen) playlists
(40, 'K-Pop Collection', 'Korean pop music favorites', 1, '2023-02-01 13:15:00'),
(40, 'Indie Gems', 'Underground and alternative tracks', 1, '2023-02-25 17:40:00'),
(40, 'Focus Flow', 'Concentration and productivity music', 0, '2023-03-12 10:30:00'),

-- User 41 (James Wilson) playlists
(41, 'Country Roads', 'Country and folk music', 1, '2023-02-05 11:45:00'),
(41, 'Blues Journey', 'Blues and soul classics', 1, '2023-02-15 16:20:00'),
(41, 'Morning Coffee', 'Gentle music to start the day', 0, '2023-03-08 07:30:00'),

-- User 42 (Maria Garcia) playlists
(42, 'Dance Floor', 'Electronic and dance music', 1, '2023-02-08 19:00:00'),
(42, 'Romantic Evening', 'Love songs and ballads', 0, '2023-02-18 21:15:00'),
(42, 'Summer Vibes', 'Upbeat songs for warm weather', 1, '2023-03-01 12:30:00'),

-- User 43 (Robert Brown) playlists
(43, 'Jazz Lounge', 'Smooth jazz and instrumental', 1, '2023-02-12 14:50:00'),
(43, 'Classical Moments', 'Orchestral and classical pieces', 1, '2023-02-22 11:25:00'),
(43, 'Deep Focus', 'Ambient and atmospheric music', 0, '2023-03-18 15:40:00'),

-- User 44 (Jennifer Davis) playlists
(44, 'Pop Princess', 'Contemporary pop hits', 1, '2023-02-14 16:35:00'),
(44, 'R&B Soul', 'Rhythm and blues favorites', 1, '2023-02-24 13:20:00'),
(44, 'Yoga Flow', 'Peaceful music for meditation', 0, '2023-03-22 08:45:00'),

-- User 45 (Christopher Lee) playlists
(45, 'Metal Mayhem', 'Heavy metal and hard rock', 1, '2023-02-16 18:10:00'),
(45, 'Punk Attitude', 'Punk rock and alternative', 1, '2023-02-26 20:55:00'),
(45, 'Gaming Soundtrack', 'Epic music for gaming sessions', 0, '2023-03-25 23:30:00'),

-- User 46 (Amanda White) playlists
(46, 'Folk Stories', 'Folk and acoustic storytelling', 1, '2023-02-18 10:40:00'),
(46, 'World Music', 'International and cultural sounds', 1, '2023-02-28 15:15:00'),
(46, 'Bedtime Stories', 'Calming music for sleep', 0, '2023-03-28 21:20:00'),

-- User 47 (Kevin Martinez) playlists
(47, 'Hip Hop Heads', 'Rap and hip hop essentials', 1, '2023-02-20 12:25:00'),
(47, 'Reggae Roots', 'Jamaican and reggae music', 1, '2023-03-02 17:50:00'),
(47, 'Workout Beast', 'Intense tracks for training', 0, '2023-03-30 06:15:00'),

-- User 48 (Rachel Green) playlists
(48, 'Indie Pop', 'Independent pop artists', 1, '2023-02-22 14:30:00'),
(48, 'Singer Songwriter', 'Acoustic and intimate performances', 1, '2023-03-04 19:45:00'),
(48, 'Coffee Shop', 'Background music for casual listening', 0, '2023-04-01 09:30:00'),

-- User 49 (Daniel Kim) playlists
(49, 'Electronic Dreams', 'Electronic and synth music', 1, '2023-02-24 16:20:00'),
(49, 'Ambient Space', 'Atmospheric and ambient sounds', 1, '2023-03-06 22:10:00'),
(49, 'Creative Flow', 'Inspirational music for artists', 0, '2023-04-03 14:25:00'),

-- User 50 (Stephanie Taylor) playlists
(50, 'Girl Power', 'Empowering songs by female artists', 1, '2023-02-26 11:35:00'),
(50, 'Retro Revival', '80s and 90s throwbacks', 1, '2023-03-08 16:40:00'),
(50, 'Self Care', 'Healing and therapeutic music', 0, '2023-04-05 20:15:00');

-- Insert User Follows Artist relationships
INSERT INTO user_follows_artist (UserID, ArtistID, FollowedAt) VALUES
-- User 36 follows multiple artists
(36, 5, '2023-01-15 10:30:00'),  -- Taylor Swift
(36, 6, '2023-01-20 14:25:00'),  -- Ed Sheeran
(36, 7, '2023-02-01 16:40:00'),  -- Billie Eilish
(36, 8, '2023-02-10 12:15:00'),  -- The Weeknd
(36, 9, '2023-02-15 18:30:00'),  -- Ariana Grande

-- User 37 follows rock artists
(37, 20, '2023-01-20 08:15:00'),  -- The Beatles
(37, 21, '2023-01-25 11:20:00'),  -- Queen
(37, 22, '2023-02-01 14:35:00'),  -- Led Zeppelin
(37, 23, '2023-02-05 17:50:00'),  -- Pink Floyd
(37, 24, '2023-02-10 20:15:00'),  -- Nirvana

-- User 38 follows diverse artists
(38, 5, '2023-01-25 12:00:00'),   -- Taylor Swift
(38, 15, '2023-02-01 15:30:00'),  -- Adele
(38, 16, '2023-02-05 18:45:00'),  -- Bruno Mars
(38, 17, '2023-02-10 21:20:00'),  -- Dua Lipa
(38, 18, '2023-02-15 09:10:00'),  -- Harry Styles

-- User 39 follows Latin and international artists
(39, 16, '2023-01-30 15:20:00'),  -- Bruno Mars
(39, 17, '2023-02-05 12:40:00'),  -- Dua Lipa
(39, 28, '2023-02-10 16:25:00'),  -- Bob Marley
(39, 32, '2023-02-15 19:30:00'),  -- Johnny Cash
(39, 33, '2023-02-20 14:15:00'),  -- Aretha Franklin

-- User 40 follows K-pop and pop artists
(40, 5, '2023-02-01 13:15:00'),   -- Taylor Swift
(40, 6, '2023-02-05 16:30:00'),   -- Ed Sheeran
(40, 7, '2023-02-10 19:45:00'),   -- Billie Eilish
(40, 9, '2023-02-15 11:20:00'),   -- Ariana Grande
(40, 17, '2023-02-20 14:35:00'),  -- Dua Lipa

-- User 41 follows country and folk artists
(41, 30, '2023-02-05 11:45:00'),  -- Bob Dylan
(41, 32, '2023-02-10 14:20:00'),  -- Johnny Cash
(41, 5, '2023-02-15 17:30:00'),   -- Taylor Swift (country roots)
(41, 6, '2023-02-20 20:15:00'),   -- Ed Sheeran
(41, 13, '2023-02-25 13:40:00'),  -- Lorde

-- User 42 follows electronic and dance artists
(42, 26, '2023-02-08 19:00:00'),  -- Skrillex
(42, 27, '2023-02-12 21:30:00'),  -- Deadmau5
(42, 11, '2023-02-16 15:45:00'),  -- Beyoncé
(42, 8, '2023-02-20 18:20:00'),   -- The Weeknd
(42, 9, '2023-02-24 16:10:00'),   -- Ariana Grande

-- User 43 follows jazz and classical artists
(43, 29, '2023-02-12 14:50:00'),  -- Mozart
(43, 31, '2023-02-16 17:25:00'),  -- Brian Eno
(43, 33, '2023-02-20 20:40:00'),  -- Aretha Franklin
(43, 30, '2023-02-24 13:15:00'),  -- Bob Dylan
(43, 32, '2023-02-28 16:30:00'),  -- Johnny Cash

-- User 44 follows pop and R&B artists
(44, 5, '2023-02-14 16:35:00'),   -- Taylor Swift
(44, 6, '2023-02-18 19:20:00'),   -- Ed Sheeran
(44, 7, '2023-02-22 12:45:00'),   -- Billie Eilish
(44, 8, '2023-02-26 15:30:00'),   -- The Weeknd
(44, 9, '2023-03-02 18:15:00'),   -- Ariana Grande

-- User 45 follows metal and rock artists
(45, 24, '2023-02-16 18:10:00'),  -- Nirvana
(45, 25, '2023-02-20 21:35:00'),  -- Metallica
(45, 22, '2023-02-24 14:50:00'),  -- Led Zeppelin
(45, 23, '2023-02-28 17:25:00'),  -- Pink Floyd
(45, 20, '2023-03-04 20:40:00'),  -- The Beatles

-- User 46 follows folk and world music artists
(46, 30, '2023-02-18 10:40:00'),  -- Bob Dylan
(46, 28, '2023-02-22 13:55:00'),  -- Bob Marley
(46, 32, '2023-02-26 16:20:00'),  -- Johnny Cash
(46, 5, '2023-03-02 19:15:00'),   -- Taylor Swift
(46, 6, '2023-03-06 11:30:00'),   -- Ed Sheeran

-- User 47 follows hip hop and reggae artists
(47, 10, '2023-02-20 12:25:00'),  -- Drake
(47, 12, '2023-02-24 15:40:00'),  -- Kendrick Lamar
(47, 28, '2023-02-28 18:25:00'),  -- Bob Marley
(47, 8, '2023-03-04 21:10:00'),   -- The Weeknd
(47, 9, '2023-03-08 14:35:00'),   -- Ariana Grande

-- User 48 follows indie and singer-songwriter artists
(48, 13, '2023-02-22 14:30:00'),  -- Lorde
(48, 14, '2023-02-26 17:45:00'),  -- Frank Ocean
(48, 5, '2023-03-02 20:20:00'),   -- Taylor Swift
(48, 6, '2023-03-06 13:15:00'),   -- Ed Sheeran
(48, 18, '2023-03-10 16:30:00'),  -- Harry Styles

-- User 49 follows electronic and ambient artists
(49, 26, '2023-02-24 16:20:00'),  -- Skrillex
(49, 27, '2023-02-28 19:35:00'),  -- Deadmau5
(49, 31, '2023-03-04 22:50:00'),  -- Brian Eno
(49, 23, '2023-03-08 15:25:00'),  -- Pink Floyd
(49, 34, '2023-03-12 18:40:00'),  -- Radiohead

-- User 50 follows diverse female artists
(50, 5, '2023-02-26 11:35:00'),   -- Taylor Swift
(50, 7, '2023-03-02 14:50:00'),    -- Billie Eilish
(50, 9, '2023-03-06 17:25:00'),    -- Ariana Grande
(50, 11, '2023-03-10 20:15:00'),   -- Beyoncé
(50, 13, '2023-03-14 13:40:00'),   -- Lorde
(50, 17, '2023-03-18 16:55:00'),   -- Dua Lipa
(50, 19, '2023-03-22 19:30:00'),   -- Olivia Rodrigo
(50, 33, '2023-03-26 12:45:00');   -- Aretha Franklin

-- Insert User Likes Song relationships
INSERT INTO user_likes_song (UserID, SongID, LikedAt) VALUES
-- User 36 likes various pop songs
(36, 1, '2023-01-15 10:30:00'),   -- The 1
(36, 2, '2023-01-16 14:20:00'),   -- Cardigan
(36, 6, '2023-01-20 16:45:00'),   -- Willow
(36, 11, '2023-01-25 12:30:00'),  -- Anti-Hero
(36, 16, '2023-02-01 18:15:00'),  -- Shape of You
(36, 21, '2023-02-05 20:40:00'),  -- Bad Guy
(36, 26, '2023-02-10 15:25:00'),  -- Alone Again
(36, 31, '2023-02-15 17:50:00'),  -- Shut Up
(36, 36, '2023-02-20 19:35:00'),  -- Champagne Poetry
(36, 41, '2023-02-25 21:10:00'),  -- I'M THAT GIRL

-- User 37 likes rock songs
(37, 1, '2023-01-20 08:15:00'), -- The 1
(37, 2, '2023-01-22 11:30:00'), -- Cardigan
(37, 6, '2023-01-25 14:45:00'), -- Willow
(37, 11, '2023-02-01 17:20:00'), -- Anti-Hero
(37, 16, '2023-02-05 20:15:00'), -- Shape of You
(37, 21, '2023-02-10 13:40:00'), -- Bad Guy
(37, 26, '2023-02-15 16:25:00'), -- Alone Again
(37, 31, '2023-02-20 19:50:00'), -- Shut Up
(37, 36, '2023-02-25 22:15:00'), -- Champagne Poetry
(37, 41, '2023-03-01 15:30:00'), -- I'M THAT GIRL

-- User 38 likes diverse songs
(38, 1, '2023-01-25 12:00:00'),   -- The 1
(38, 6, '2023-01-28 15:20:00'),   -- Willow
(38, 11, '2023-02-01 18:45:00'),   -- Anti-Hero
(38, 16, '2023-02-05 21:10:00'),  -- Shape of You
(38, 21, '2023-02-10 14:35:00'),  -- Bad Guy
(38, 26, '2023-02-15 17:50:00'),  -- Alone Again
(38, 31, '2023-02-20 20:25:00'),  -- Shut Up
(38, 36, '2023-02-25 13:40:00'),  -- Champagne Poetry
(38, 41, '2023-03-01 16:55:00'),  -- I'M THAT GIRL
(38, 46, '2023-03-05 19:20:00'),  -- BLOOD.

-- User 39 likes Latin and international songs
(39, 16, '2023-01-30 15:20:00'),  -- Shape of You
(39, 21, '2023-02-02 18:35:00'),  -- Bad Guy
(39, 26, '2023-02-05 21:50:00'),  -- Alone Again
(39, 31, '2023-02-10 14:15:00'),  -- Shut Up
(39, 36, '2023-02-15 17:30:00'),  -- Champagne Poetry
(39, 41, '2023-02-20 20:45:00'),  -- I'M THAT GIRL
(39, 46, '2023-02-25 13:20:00'),  -- BLOOD.
(39, 51, '2023-03-01 16:35:00'),  -- United In Grief
(39, 56, '2023-03-05 19:50:00'),  -- Green Light
(39, 61, '2023-03-10 22:15:00'),  -- Nikes

-- User 40 likes K-pop and pop songs
(40, 1, '2023-02-01 13:15:00'),   -- The 1
(40, 2, '2023-02-03 16:30:00'),   -- Cardigan
(40, 6, '2023-02-06 19:45:00'),   -- Willow
(40, 11, '2023-02-10 12:20:00'),  -- Anti-Hero
(40, 16, '2023-02-15 15:35:00'),  -- Shape of You
(40, 21, '2023-02-20 18:50:00'), -- Bad Guy
(40, 26, '2023-02-25 21:05:00'),  -- Alone Again
(40, 31, '2023-03-01 14:40:00'),  -- Shut Up
(40, 36, '2023-03-05 17:55:00'),  -- Champagne Poetry
(40, 41, '2023-03-10 20:10:00'),  -- I'M THAT GIRL

-- User 41 likes country and folk songs
(41, 16, '2023-02-05 11:45:00'),  -- Shape of You
(41, 21, '2023-02-08 14:20:00'),  -- Bad Guy
(41, 26, '2023-02-12 17:35:00'),  -- Alone Again
(41, 31, '2023-02-16 20:50:00'),  -- Shut Up
(41, 36, '2023-02-20 13:25:00'),  -- Champagne Poetry
(41, 41, '2023-02-24 16:40:00'),  -- I'M THAT GIRL
(41, 46, '2023-02-28 19:55:00'),  -- BLOOD.
(41, 51, '2023-03-04 12:30:00'),  -- United In Grief
(41, 56, '2023-03-08 15:45:00'),  -- Green Light
(41, 61, '2023-03-12 18:00:00'),  -- Nikes

-- User 42 likes electronic and dance songs
(42, 26, '2023-02-08 19:00:00'),  -- Alone Again
(42, 31, '2023-02-11 22:15:00'),  -- Shut Up
(42, 36, '2023-02-15 15:30:00'),  -- Champagne Poetry
(42, 41, '2023-02-19 18:45:00'),  -- I'M THAT GIRL
(42, 46, '2023-02-23 21:00:00'),  -- BLOOD.
(42, 51, '2023-02-27 14:15:00'),  -- United In Grief
(42, 56, '2023-03-03 17:30:00'),  -- Green Light
(42, 61, '2023-03-07 20:45:00'),  -- Nikes
(42, 66, '2023-03-11 13:00:00'),  -- Airbag
(42, 71, '2023-03-15 16:15:00'),  -- Everything in Its Right Place

-- User 43 likes jazz and classical songs
(43, 29, '2023-02-12 14:50:00'),  -- Mozart Symphony
(43, 31, '2023-02-16 17:25:00'),  -- Brian Eno
(43, 33, '2023-02-20 20:40:00'),  -- Aretha Franklin
(43, 30, '2023-02-24 13:15:00'),  -- Bob Dylan
(43, 32, '2023-02-28 16:30:00'),  -- Johnny Cash
(43, 36, '2023-03-04 19:45:00'),  -- Champagne Poetry
(43, 41, '2023-03-08 12:00:00'),  -- I'M THAT GIRL
(43, 46, '2023-03-12 15:15:00'),  -- BLOOD.
(43, 51, '2023-03-16 18:30:00'),  -- United In Grief
(43, 56, '2023-03-20 21:45:00'),  -- Green Light

-- User 44 likes pop and R&B songs
(44, 1, '2023-02-14 16:35:00'),   -- The 1
(44, 2, '2023-02-17 19:50:00'),   -- Cardigan
(44, 6, '2023-02-21 12:25:00'),   -- Willow
(44, 11, '2023-02-25 15:40:00'),  -- Anti-Hero
(44, 16, '2023-03-01 18:55:00'),  -- Shape of You
(44, 21, '2023-03-05 21:10:00'), -- Bad Guy
(44, 26, '2023-03-09 14:25:00'), -- Alone Again
(44, 31, '2023-03-13 17:40:00'), -- Shut Up
(44, 36, '2023-03-17 20:55:00'), -- Champagne Poetry
(44, 41, '2023-03-21 13:20:00'), -- I'M THAT GIRL

-- User 45 likes metal and rock songs
(45, 1, '2023-02-16 18:10:00'), -- The 1
(45, 11, '2023-02-20 21:35:00'), -- Anti-Hero
(45, 16, '2023-02-24 14:50:00'), -- Shape of You
(45, 21, '2023-02-28 17:25:00'), -- Bad Guy
(45, 26, '2023-03-04 20:40:00'), -- Alone Again
(45, 31, '2023-03-08 13:55:00'), -- Shut Up
(45, 36, '2023-03-12 17:10:00'), -- Champagne Poetry
(45, 41, '2023-03-16 20:25:00'), -- I'M THAT GIRL
(45, 46, '2023-03-20 15:40:00'), -- BLOOD.
(45, 51, '2023-03-24 18:55:00'), -- United In Grief

-- User 46 likes folk and world music songs
(46, 16, '2023-02-18 10:40:00'),  -- Shape of You
(46, 21, '2023-02-22 13:55:00'),  -- Bad Guy
(46, 26, '2023-02-26 16:20:00'),  -- Alone Again
(46, 31, '2023-03-02 19:15:00'),  -- Shut Up
(46, 36, '2023-03-06 12:30:00'),  -- Champagne Poetry
(46, 41, '2023-03-10 15:45:00'),  -- I'M THAT GIRL
(46, 46, '2023-03-14 18:00:00'),  -- BLOOD.
(46, 51, '2023-03-18 21:15:00'),  -- United In Grief
(46, 56, '2023-03-22 14:30:00'),  -- Green Light
(46, 61, '2023-03-26 17:45:00'),  -- Nikes

-- User 47 likes hip hop and reggae songs
(47, 36, '2023-02-20 12:25:00'),  -- Champagne Poetry
(47, 41, '2023-02-24 15:40:00'),  -- I'M THAT GIRL
(47, 46, '2023-02-28 18:25:00'),  -- BLOOD.
(47, 51, '2023-03-04 21:10:00'),  -- United In Grief
(47, 56, '2023-03-08 14:35:00'),  -- Green Light
(47, 61, '2023-03-12 17:50:00'),  -- Nikes
(47, 66, '2023-03-16 20:05:00'),  -- Airbag
(47, 71, '2023-03-20 13:20:00'),  -- Everything in Its Right Place
(47, 76, '2023-03-24 16:35:00'),  -- Five Years
(47, 81, '2023-03-28 19:50:00'),  -- Natural Mystic

-- User 48 likes indie and singer-songwriter songs
(48, 1, '2023-02-22 14:30:00'),   -- The 1
(48, 2, '2023-02-26 17:45:00'),   -- Cardigan
(48, 6, '2023-03-02 20:20:00'),   -- Willow
(48, 11, '2023-03-06 13:15:00'),  -- Anti-Hero
(48, 16, '2023-03-10 16:30:00'),  -- Shape of You
(48, 21, '2023-03-14 19:45:00'),  -- Bad Guy
(48, 26, '2023-03-18 12:20:00'),  -- Alone Again
(48, 31, '2023-03-22 15:35:00'),  -- Shut Up
(48, 36, '2023-03-26 18:50:00'),  -- Champagne Poetry
(48, 41, '2023-03-30 21:05:00'),  -- I'M THAT GIRL

-- User 49 likes electronic and ambient songs
(49, 26, '2023-02-24 16:20:00'),  -- Alone Again
(49, 31, '2023-02-28 19:35:00'),  -- Shut Up
(49, 36, '2023-03-04 22:50:00'),  -- Champagne Poetry
(49, 41, '2023-03-08 15:25:00'),  -- I'M THAT GIRL
(49, 46, '2023-03-12 18:40:00'),  -- BLOOD.
(49, 51, '2023-03-16 21:55:00'),  -- United In Grief
(49, 56, '2023-03-20 14:30:00'),  -- Green Light
(49, 61, '2023-03-24 17:45:00'),  -- Nikes
(49, 66, '2023-03-28 20:00:00'),  -- Airbag
(49, 71, '2023-04-01 13:15:00'),  -- Everything in Its Right Place

-- User 50 likes diverse female artist songs
(50, 1, '2023-02-26 11:35:00'),   -- The 1
(50, 2, '2023-03-02 14:50:00'),    -- Cardigan
(50, 6, '2023-03-06 17:25:00'),    -- Willow
(50, 11, '2023-03-10 20:15:00'),   -- Anti-Hero
(50, 16, '2023-03-14 13:40:00'),   -- Shape of You
(50, 21, '2023-03-18 16:55:00'),   -- Bad Guy
(50, 26, '2023-03-22 19:30:00'),   -- Alone Again
(50, 31, '2023-03-26 12:45:00'),   -- Shut Up
(50, 36, '2023-03-30 15:00:00'),   -- Champagne Poetry
(50, 41, '2023-04-03 18:15:00');   -- I'M THAT GIRL

-- Insert User Likes Album relationships
INSERT INTO user_likes_album (UserID, AlbumID, LikedAt) VALUES
-- User 36 likes pop albums
(36, 1, '2023-01-15 10:30:00'),   -- Folklore
(36, 2, '2023-01-20 14:25:00'),   -- Evermore
(36, 3, '2023-02-01 16:40:00'),   -- Midnights
(36, 4, '2023-02-10 12:15:00'),   -- Divide
(36, 7, '2023-02-15 18:30:00'),   -- When We All Fall Asleep
(36, 8, '2023-02-20 15:45:00'),   -- Happier Than Ever
(36, 9, '2023-02-25 17:20:00'),  -- After Hours
(36, 10, '2023-03-01 19:35:00'),  -- Dawn FM
(36, 11, '2023-03-05 21:50:00'), -- Positions
(36, 12, '2023-03-10 14:15:00'), -- Sweetener

-- User 37 likes rock albums
(37, 33, '2023-01-20 08:15:00'),  -- Abbey Road
(37, 34, '2023-01-25 11:20:00'),  -- Sgt. Pepper's
(37, 35, '2023-02-01 14:35:00'),  -- A Night at the Opera
(37, 36, '2023-02-05 17:50:00'),  -- News of the World
(37, 37, '2023-02-10 20:15:00'),  -- Led Zeppelin IV
(37, 38, '2023-02-15 13:30:00'),  -- Physical Graffiti
(37, 39, '2023-02-20 16:45:00'),  -- The Dark Side of the Moon
(37, 40, '2023-02-25 19:00:00'),  -- The Wall
(37, 41, '2023-03-01 22:15:00'), -- Nevermind
(37, 42, '2023-03-05 15:30:00'), -- In Utero

-- User 38 likes diverse albums
(38, 1, '2023-01-25 12:00:00'),   -- Folklore
(38, 2, '2023-02-01 15:30:00'),   -- Evermore
(38, 3, '2023-02-05 18:45:00'),   -- Midnights
(38, 4, '2023-02-10 21:20:00'),   -- Divide
(38, 7, '2023-02-15 09:10:00'),   -- When We All Fall Asleep
(38, 8, '2023-02-20 12:25:00'),   -- Happier Than Ever
(38, 9, '2023-02-25 15:40:00'),  -- After Hours
(38, 10, '2023-03-01 18:55:00'), -- Dawn FM
(38, 11, '2023-03-05 21:10:00'), -- Positions
(38, 12, '2023-03-10 14:25:00'), -- Sweetener

-- User 39 likes Latin and international albums
(39, 4, '2023-01-30 15:20:00'),   -- Divide
(39, 5, '2023-02-05 12:40:00'),   -- No.6 Collaborations Project
(39, 6, '2023-02-10 16:25:00'),   -- Equals
(39, 7, '2023-02-15 19:30:00'),   -- When We All Fall Asleep
(39, 8, '2023-02-20 14:15:00'),   -- Happier Than Ever
(39, 9, '2023-02-25 17:30:00'),   -- After Hours
(39, 10, '2023-03-01 20:45:00'),  -- Dawn FM
(39, 11, '2023-03-05 13:20:00'), -- Positions
(39, 12, '2023-03-10 16:35:00'), -- Sweetener
(39, 13, '2023-03-15 19:50:00'), -- Certified Lover Boy

-- User 40 likes K-pop and pop albums
(40, 1, '2023-02-01 13:15:00'),   -- Folklore
(40, 2, '2023-02-05 16:30:00'),   -- Evermore
(40, 3, '2023-02-10 19:45:00'),   -- Midnights
(40, 4, '2023-02-15 12:20:00'),   -- Divide
(40, 5, '2023-02-20 15:35:00'),   -- No.6 Collaborations Project
(40, 6, '2023-02-25 18:50:00'),   -- Equals
(40, 7, '2023-03-01 21:05:00'),   -- When We All Fall Asleep
(40, 8, '2023-03-05 14:20:00'),   -- Happier Than Ever
(40, 9, '2023-03-10 17:35:00'),  -- After Hours
(40, 10, '2023-03-15 20:50:00'), -- Dawn FM

-- User 41 likes country and folk albums
(41, 1, '2023-02-05 11:45:00'),   -- Folklore
(41, 2, '2023-02-10 14:20:00'),   -- Evermore
(41, 4, '2023-02-15 17:30:00'),   -- Divide
(41, 5, '2023-02-20 20:15:00'),   -- No.6 Collaborations Project
(41, 6, '2023-02-25 13:40:00'),   -- Equals
(41, 7, '2023-03-01 16:55:00'),   -- When We All Fall Asleep
(41, 8, '2023-03-05 20:10:00'),   -- Happier Than Ever
(41, 9, '2023-03-10 13:25:00'),  -- After Hours
(41, 10, '2023-03-15 16:40:00'), -- Dawn FM
(41, 11, '2023-03-20 19:55:00'), -- Positions

-- User 42 likes electronic and dance albums
(42, 7, '2023-02-08 19:00:00'),   -- When We All Fall Asleep
(42, 8, '2023-02-12 21:30:00'),   -- Happier Than Ever
(42, 9, '2023-02-16 15:45:00'),   -- After Hours
(42, 10, '2023-02-20 18:20:00'), -- Dawn FM
(42, 11, '2023-02-24 16:10:00'), -- Positions
(42, 12, '2023-02-28 19:25:00'), -- Sweetener
(42, 13, '2023-03-04 22:40:00'), -- Certified Lover Boy
(42, 14, '2023-03-08 15:55:00'), -- Honestly, Nevermind
(42, 15, '2023-03-12 18:10:00'), -- Renaissance
(42, 16, '2023-03-16 21:25:00'), -- Lemonade

-- User 43 likes jazz and classical albums
(43, 29, '2023-02-12 14:50:00'), -- Symphony No. 40
(43, 30, '2023-02-16 17:25:00'), -- The Magic Flute
(43, 31, '2023-02-20 20:40:00'), -- Music for Airports
(43, 32, '2023-02-24 13:15:00'), -- Another Green World
(43, 33, '2023-02-28 16:30:00'), -- At Folsom Prison
(43, 34, '2023-03-04 19:45:00'), -- American IV
(43, 35, '2023-03-08 12:00:00'), -- I Never Loved a Man
(43, 36, '2023-03-12 15:15:00'), -- Amazing Grace
(43, 37, '2023-03-16 18:30:00'), -- OK Computer
(43, 38, '2023-03-20 21:45:00'), -- Kid A

-- User 44 likes pop and R&B albums
(44, 1, '2023-02-14 16:35:00'),   -- Folklore
(44, 2, '2023-02-18 19:20:00'),   -- Evermore
(44, 3, '2023-02-22 12:45:00'),   -- Midnights
(44, 4, '2023-02-26 15:30:00'),   -- Divide
(44, 5, '2023-03-02 18:15:00'),   -- No.6 Collaborations Project
(44, 6, '2023-03-06 21:30:00'),   -- Equals
(44, 7, '2023-03-10 14:45:00'),   -- When We All Fall Asleep
(44, 8, '2023-03-14 17:00:00'),   -- Happier Than Ever
(44, 9, '2023-03-18 20:15:00'),  -- After Hours
(44, 10, '2023-03-22 13:30:00'), -- Dawn FM

-- User 45 likes metal and rock albums
(45, 33, '2023-02-16 18:10:00'),  -- Abbey Road
(45, 34, '2023-02-20 21:35:00'),  -- Sgt. Pepper's
(45, 35, '2023-02-24 14:50:00'),  -- A Night at the Opera
(45, 36, '2023-02-28 17:25:00'),  -- News of the World
(45, 37, '2023-03-04 20:40:00'),  -- Led Zeppelin IV
(45, 38, '2023-03-08 13:55:00'),  -- Physical Graffiti
(45, 39, '2023-03-12 17:10:00'),  -- The Dark Side of the Moon
(45, 40, '2023-03-16 20:25:00'),  -- The Wall
(45, 41, '2023-03-20 15:40:00'),  -- Nevermind
(45, 42, '2023-03-24 18:55:00'),  -- In Utero

-- User 46 likes folk and world music albums
(46, 1, '2023-02-18 10:40:00'),   -- Folklore
(46, 2, '2023-02-22 13:55:00'),   -- Evermore
(46, 4, '2023-02-26 16:20:00'),   -- Divide
(46, 5, '2023-03-02 19:15:00'),   -- No.6 Collaborations Project
(46, 6, '2023-03-06 12:30:00'),   -- Equals
(46, 7, '2023-03-10 15:45:00'),   -- When We All Fall Asleep
(46, 8, '2023-03-14 18:00:00'),   -- Happier Than Ever
(46, 9, '2023-03-18 21:15:00'),  -- After Hours
(46, 10, '2023-03-22 14:30:00'), -- Dawn FM
(46, 11, '2023-03-26 17:45:00'), -- Positions

-- User 47 likes hip hop and reggae albums
(47, 13, '2023-02-20 12:25:00'),  -- Certified Lover Boy
(47, 14, '2023-02-24 15:40:00'),  -- Honestly, Nevermind
(47, 15, '2023-02-28 18:25:00'),  -- Renaissance
(47, 16, '2023-03-04 21:10:00'),  -- Lemonade
(47, 17, '2023-03-08 14:35:00'),  -- DAMN.
(47, 18, '2023-03-12 17:50:00'),  -- Mr. Morale & The Big Steppers
(47, 19, '2023-03-16 20:05:00'),  -- Melodrama
(47, 20, '2023-03-20 13:20:00'),  -- Solar Power
(47, 21, '2023-03-24 16:35:00'),  -- Blonde
(47, 22, '2023-03-28 19:50:00'),  -- Channel Orange

-- User 48 likes indie and singer-songwriter albums
(48, 1, '2023-02-22 14:30:00'),   -- Folklore
(48, 2, '2023-02-26 17:45:00'),   -- Evermore
(48, 3, '2023-03-02 20:20:00'),   -- Midnights
(48, 4, '2023-03-06 13:15:00'),   -- Divide
(48, 5, '2023-03-10 16:30:00'),   -- No.6 Collaborations Project
(48, 6, '2023-03-14 19:45:00'),   -- Equals
(48, 7, '2023-03-18 12:20:00'),   -- When We All Fall Asleep
(48, 8, '2023-03-22 15:35:00'),   -- Happier Than Ever
(48, 9, '2023-03-26 18:50:00'),  -- After Hours
(48, 10, '2023-03-30 21:05:00'), -- Dawn FM

-- User 49 likes electronic and ambient albums
(49, 7, '2023-02-24 16:20:00'),   -- When We All Fall Asleep
(49, 8, '2023-02-28 19:35:00'),   -- Happier Than Ever
(49, 9, '2023-03-04 22:50:00'),   -- After Hours
(49, 10, '2023-03-08 15:25:00'),  -- Dawn FM
(49, 11, '2023-03-12 18:40:00'),  -- Positions
(49, 12, '2023-03-16 21:55:00'),  -- Sweetener
(49, 13, '2023-03-20 14:30:00'),  -- Certified Lover Boy
(49, 14, '2023-03-24 17:45:00'),  -- Honestly, Nevermind
(49, 15, '2023-03-28 20:00:00'),  -- Renaissance
(49, 16, '2023-04-01 13:15:00'),  -- Lemonade

-- User 50 likes diverse female artist albums
(50, 1, '2023-02-26 11:35:00'),   -- Folklore
(50, 2, '2023-03-02 14:50:00'),    -- Evermore
(50, 3, '2023-03-06 17:25:00'),    -- Midnights
(50, 7, '2023-03-10 20:15:00'),   -- When We All Fall Asleep
(50, 8, '2023-03-14 13:40:00'),   -- Happier Than Ever
(50, 9, '2023-03-18 16:55:00'),   -- After Hours
(50, 10, '2023-03-22 19:30:00'),  -- Dawn FM
(50, 11, '2023-03-26 12:45:00'),  -- Positions
(50, 12, '2023-03-30 15:00:00'),  -- Sweetener
(50, 15, '2023-04-03 18:15:00');  -- Renaissance

-- Insert Playlist Songs relationships
INSERT INTO playlist_song (PlaylistID, SongID, Position, AddedAt) VALUES
-- Playlist 1 (Emma's Favorites) - 10 songs
(1, 1, 1, '2023-01-15 10:30:00'),   -- The 1
(1, 2, 2, '2023-01-16 14:20:00'),   -- Cardigan
(1, 6, 3, '2023-01-20 16:45:00'),   -- Willow
(1, 11, 4, '2023-01-25 12:30:00'),  -- Anti-Hero
(1, 16, 5, '2023-02-01 18:15:00'),  -- Shape of You
(1, 21, 6, '2023-02-05 20:40:00'),  -- Bad Guy
(1, 26, 7, '2023-02-10 15:25:00'),  -- Alone Again
(1, 31, 8, '2023-02-15 17:50:00'),  -- Shut Up
(1, 36, 9, '2023-02-20 19:35:00'),  -- Champagne Poetry
(1, 41, 10, '2023-02-25 21:10:00'),  -- I'M THAT GIRL

-- Playlist 2 (Emma's Workout Mix) - 8 songs
(2, 16, 1, '2023-02-15 14:20:00'),  -- Shape of You
(2, 21, 2, '2023-02-16 16:35:00'),  -- Bad Guy
(2, 26, 3, '2023-02-17 18:50:00'),  -- Alone Again
(2, 31, 4, '2023-02-18 20:05:00'),  -- Shut Up
(2, 36, 5, '2023-02-19 22:20:00'),  -- Champagne Poetry
(2, 41, 6, '2023-02-20 14:35:00'),  -- I'M THAT GIRL
(2, 46, 7, '2023-02-21 16:50:00'),  -- BLOOD.
(2, 51, 8, '2023-02-22 19:05:00'),  -- United In Grief

-- Playlist 3 (Emma's Chill Vibes) - 6 songs
(3, 1, 1, '2023-03-10 19:45:00'),   -- The 1
(3, 2, 2, '2023-03-11 21:00:00'),   -- Cardigan
(3, 6, 3, '2023-03-12 22:15:00'),   -- Willow
(3, 11, 4, '2023-03-13 23:30:00'),  -- Anti-Hero
(3, 16, 5, '2023-03-14 20:45:00'),  -- Shape of You
(3, 21, 6, '2023-03-15 22:00:00'),  -- Bad Guy

-- Playlist 4 (Michael's Road Trip) - 10 songs
(4, 1, 1, '2023-01-20 08:15:00'), -- The 1
(4, 2, 2, '2023-01-21 10:30:00'), -- Cardigan
(4, 6, 3, '2023-01-22 12:45:00'), -- Willow
(4, 11, 4, '2023-01-23 15:00:00'), -- Anti-Hero
(4, 16, 5, '2023-01-24 17:15:00'), -- Shape of You
(4, 21, 6, '2023-01-25 19:30:00'), -- Bad Guy
(4, 26, 7, '2023-01-26 21:45:00'), -- Alone Again
(4, 31, 8, '2023-01-27 14:00:00'), -- Shut Up
(4, 36, 9, '2023-01-28 16:15:00'), -- Champagne Poetry
(4, 41, 10, '2023-01-29 18:30:00'), -- I'M THAT GIRL

-- Playlist 5 (Michael's Party Time) - 8 songs
(5, 16, 1, '2023-02-28 20:30:00'),  -- Shape of You
(5, 21, 2, '2023-03-01 22:45:00'),  -- Bad Guy
(5, 26, 3, '2023-03-02 15:00:00'),  -- Alone Again
(5, 31, 4, '2023-03-03 17:15:00'),  -- Shut Up
(5, 36, 5, '2023-03-04 19:30:00'),  -- Champagne Poetry
(5, 41, 6, '2023-03-05 21:45:00'),  -- I'M THAT GIRL
(5, 46, 7, '2023-03-06 14:00:00'),  -- BLOOD.
(5, 51, 8, '2023-03-07 16:15:00'),  -- United In Grief

-- Playlist 6 (Michael's Study Music) - 5 songs
(6, 29, 1, '2023-03-05 16:00:00'),  -- Mozart Symphony
(6, 31, 2, '2023-03-06 18:15:00'),  -- Brian Eno
(6, 33, 3, '2023-03-07 20:30:00'),  -- Aretha Franklin
(6, 30, 4, '2023-03-08 22:45:00'),  -- Bob Dylan
(6, 32, 5, '2023-03-09 15:00:00'),  -- Johnny Cash

-- Playlist 7 (Sarah's Throwback Hits) - 10 songs
(7, 1, 1, '2023-01-25 12:00:00'), -- The 1
(7, 2, 2, '2023-01-26 14:15:00'), -- Cardigan
(7, 6, 3, '2023-01-27 16:30:00'), -- Willow
(7, 11, 4, '2023-01-28 18:45:00'), -- Anti-Hero
(7, 16, 5, '2023-01-29 21:00:00'), -- Shape of You
(7, 21, 6, '2023-01-30 13:15:00'), -- Bad Guy
(7, 26, 7, '2023-01-31 15:30:00'), -- Alone Again
(7, 31, 8, '2023-02-01 17:45:00'), -- Shut Up
(7, 36, 9, '2023-02-02 20:00:00'), -- Champagne Poetry
(7, 41, 10, '2023-02-03 22:15:00'), -- I'M THAT GIRL

-- Playlist 8 (Sarah's New Discoveries) - 8 songs
(8, 1, 1, '2023-02-10 18:30:00'),   -- The 1
(8, 2, 2, '2023-02-11 20:45:00'),   -- Cardigan
(8, 6, 3, '2023-02-12 23:00:00'),   -- Willow
(8, 11, 4, '2023-02-13 15:15:00'),  -- Anti-Hero
(8, 16, 5, '2023-02-14 17:30:00'),  -- Shape of You
(8, 21, 6, '2023-02-15 19:45:00'),  -- Bad Guy
(8, 26, 7, '2023-02-16 22:00:00'),  -- Alone Again
(8, 31, 8, '2023-02-17 14:15:00'),  -- Shut Up

-- Playlist 9 (Sarah's Rainy Day) - 6 songs
(9, 1, 1, '2023-03-15 11:45:00'),   -- The 1
(9, 2, 2, '2023-03-16 13:00:00'),   -- Cardigan
(9, 6, 3, '2023-03-17 15:15:00'),   -- Willow
(9, 11, 4, '2023-03-18 17:30:00'),  -- Anti-Hero
(9, 16, 5, '2023-03-19 19:45:00'),  -- Shape of You
(9, 21, 6, '2023-03-20 22:00:00'),  -- Bad Guy

-- Playlist 10 (David's Latin Vibes) - 8 songs
(10, 16, 1, '2023-01-30 15:20:00'), -- Shape of You
(10, 21, 2, '2023-01-31 17:35:00'), -- Bad Guy
(10, 26, 3, '2023-02-01 19:50:00'), -- Alone Again
(10, 31, 4, '2023-02-02 22:05:00'), -- Shut Up
(10, 36, 5, '2023-02-03 14:20:00'), -- Champagne Poetry
(10, 41, 6, '2023-02-04 16:35:00'), -- I'M THAT GIRL
(10, 46, 7, '2023-02-05 18:50:00'), -- BLOOD.
(10, 51, 8, '2023-02-06 21:05:00'), -- United In Grief

-- Playlist 11 (David's Rock Classics) - 10 songs
(11, 1, 1, '2023-02-20 09:10:00'), -- The 1
(11, 2, 2, '2023-02-21 11:25:00'), -- Cardigan
(11, 6, 3, '2023-02-22 13:40:00'), -- Willow
(11, 11, 4, '2023-02-23 15:55:00'), -- Anti-Hero
(11, 16, 5, '2023-02-24 18:10:00'), -- Shape of You
(11, 21, 6, '2023-02-25 20:25:00'), -- Bad Guy
(11, 26, 7, '2023-02-26 22:40:00'), -- Alone Again
(11, 31, 8, '2023-02-27 15:55:00'), -- Shut Up
(11, 36, 9, '2023-02-28 18:10:00'), -- Champagne Poetry
(11, 41, 10, '2023-03-01 20:25:00'), -- I'M THAT GIRL

-- Playlist 12 (David's Late Night) - 6 songs
(12, 1, 1, '2023-03-20 22:00:00'),  -- The 1
(12, 2, 2, '2023-03-21 23:15:00'),  -- Cardigan
(12, 6, 3, '2023-03-22 16:30:00'),  -- Willow
(12, 11, 4, '2023-03-23 18:45:00'), -- Anti-Hero
(12, 16, 5, '2023-03-24 21:00:00'), -- Shape of You
(12, 21, 6, '2023-03-25 23:15:00'), -- Bad Guy

-- Continue with more playlists...
-- Playlist 13 (Lisa's K-Pop Collection) - 8 songs
(13, 1, 1, '2023-02-01 13:15:00'),   -- The 1
(13, 2, 2, '2023-02-02 15:30:00'),   -- Cardigan
(13, 6, 3, '2023-02-03 17:45:00'),   -- Willow
(13, 11, 4, '2023-02-04 20:00:00'),  -- Anti-Hero
(13, 16, 5, '2023-02-05 22:15:00'),  -- Shape of You
(13, 21, 6, '2023-02-06 15:30:00'),  -- Bad Guy
(13, 26, 7, '2023-02-07 17:45:00'),  -- Alone Again
(13, 31, 8, '2023-02-08 20:00:00'),  -- Shut Up

-- Playlist 14 (Lisa's Indie Gems) - 6 songs
(14, 1, 1, '2023-02-25 17:40:00'),   -- The 1
(14, 2, 2, '2023-02-26 19:55:00'),   -- Cardigan
(14, 6, 3, '2023-02-27 22:10:00'),   -- Willow
(14, 11, 4, '2023-02-28 15:25:00'),  -- Anti-Hero
(14, 16, 5, '2023-03-01 17:40:00'),  -- Shape of You
(14, 21, 6, '2023-03-02 19:55:00'),  -- Bad Guy

-- Playlist 15 (Lisa's Focus Flow) - 5 songs
(15, 29, 1, '2023-03-12 10:30:00'),  -- Mozart Symphony
(15, 31, 2, '2023-03-13 12:45:00'),  -- Brian Eno
(15, 33, 3, '2023-03-14 15:00:00'),  -- Aretha Franklin
(15, 30, 4, '2023-03-15 17:15:00'),  -- Bob Dylan
(15, 32, 5, '2023-03-16 19:30:00');  -- Johnny Cash

-- Insert User Likes Playlist relationships
INSERT INTO user_likes_playlist (UserID, PlaylistID, LikedAt) VALUES
-- User 36 likes various playlists
(36, 1, '2023-01-15 10:30:00'),   -- My Favorites
(36, 2, '2023-02-15 14:20:00'),   -- Workout Mix
(36, 3, '2023-03-10 19:45:00'),   -- Chill Vibes
(36, 4, '2023-01-20 08:15:00'),   -- Road Trip
(36, 5, '2023-02-28 20:30:00'),   -- Party Time
(36, 7, '2023-01-25 12:00:00'),   -- Throwback Hits
(36, 8, '2023-02-10 18:30:00'),   -- New Discoveries
(36, 10, '2023-01-30 15:20:00'),  -- Latin Vibes
(36, 11, '2023-02-20 09:10:00'),  -- Rock Classics
(36, 13, '2023-02-01 13:15:00'),  -- K-Pop Collection

-- User 37 likes rock and party playlists
(37, 4, '2023-01-20 08:15:00'),   -- Road Trip
(37, 5, '2023-02-28 20:30:00'),   -- Party Time
(37, 7, '2023-01-25 12:00:00'),   -- Throwback Hits
(37, 11, '2023-02-20 09:10:00'),  -- Rock Classics
(37, 1, '2023-01-15 10:30:00'),   -- My Favorites
(37, 2, '2023-02-15 14:20:00'),   -- Workout Mix
(37, 3, '2023-03-10 19:45:00'),   -- Chill Vibes
(37, 6, '2023-03-05 16:00:00'),   -- Study Music
(37, 8, '2023-02-10 18:30:00'),   -- New Discoveries
(37, 9, '2023-03-15 11:45:00'),   -- Rainy Day

-- User 38 likes diverse playlists
(38, 1, '2023-01-15 10:30:00'),   -- My Favorites
(38, 2, '2023-02-15 14:20:00'),   -- Workout Mix
(38, 3, '2023-03-10 19:45:00'),   -- Chill Vibes
(38, 4, '2023-01-20 08:15:00'),   -- Road Trip
(38, 5, '2023-02-28 20:30:00'),   -- Party Time
(38, 6, '2023-03-05 16:00:00'),   -- Study Music
(38, 7, '2023-01-25 12:00:00'),   -- Throwback Hits
(38, 8, '2023-02-10 18:30:00'),   -- New Discoveries
(38, 9, '2023-03-15 11:45:00'),   -- Rainy Day
(38, 10, '2023-01-30 15:20:00'),  -- Latin Vibes

-- User 39 likes Latin and international playlists
(39, 10, '2023-01-30 15:20:00'),  -- Latin Vibes
(39, 11, '2023-02-20 09:10:00'),  -- Rock Classics
(39, 12, '2023-03-20 22:00:00'),  -- Late Night
(39, 1, '2023-01-15 10:30:00'),   -- My Favorites
(39, 2, '2023-02-15 14:20:00'),   -- Workout Mix
(39, 3, '2023-03-10 19:45:00'),   -- Chill Vibes
(39, 4, '2023-01-20 08:15:00'),   -- Road Trip
(39, 5, '2023-02-28 20:30:00'),   -- Party Time
(39, 6, '2023-03-05 16:00:00'),   -- Study Music
(39, 7, '2023-01-25 12:00:00'),   -- Throwback Hits

-- User 40 likes K-pop and pop playlists
(40, 13, '2023-02-01 13:15:00'),  -- K-Pop Collection
(40, 14, '2023-02-25 17:40:00'),  -- Indie Gems
(40, 15, '2023-03-12 10:30:00'),  -- Focus Flow
(40, 1, '2023-01-15 10:30:00'),   -- My Favorites
(40, 2, '2023-02-15 14:20:00'),   -- Workout Mix
(40, 3, '2023-03-10 19:45:00'),   -- Chill Vibes
(40, 4, '2023-01-20 08:15:00'),   -- Road Trip
(40, 5, '2023-02-28 20:30:00'),   -- Party Time
(40, 6, '2023-03-05 16:00:00'),   -- Study Music
(40, 7, '2023-01-25 12:00:00');   -- Throwback Hits

-- Insert Listening History
INSERT INTO listening_history (UserID, SongID, ListenedAt, Duration) VALUES
-- User 36 listening history
(36, 1, '2023-01-15 10:30:00', 240),   -- The 1
(36, 2, '2023-01-16 14:20:00', 195),   -- Cardigan
(36, 6, '2023-01-20 16:45:00', 190),   -- Willow
(36, 11, '2023-01-25 12:30:00', 200),  -- Anti-Hero
(36, 16, '2023-02-01 18:15:00', 233),  -- Shape of You
(36, 21, '2023-02-05 20:40:00', 194),  -- Bad Guy
(36, 26, '2023-02-10 15:25:00', 240),  -- Alone Again
(36, 31, '2023-02-15 17:50:00', 180),  -- Shut Up
(36, 36, '2023-02-20 19:35:00', 320),  -- Champagne Poetry
(36, 41, '2023-02-25 21:10:00', 180),  -- I'M THAT GIRL

-- User 37 listening history
(37, 1, '2023-01-20 08:15:00', 260), -- The 1
(37, 2, '2023-01-22 11:30:00', 180), -- Cardigan
(37, 6, '2023-01-25 14:45:00', 120), -- Willow
(37, 11, '2023-02-01 17:20:00', 220), -- Anti-Hero
(37, 16, '2023-02-05 20:15:00', 355), -- Shape of You
(37, 21, '2023-02-10 13:40:00', 300), -- Bad Guy
(37, 26, '2023-02-15 16:25:00', 482), -- Alone Again
(37, 31, '2023-02-20 19:50:00', 301), -- Shut Up
(37, 36, '2023-02-25 22:15:00', 300), -- Champagne Poetry
(37, 41, '2023-03-01 15:30:00', 331), -- I'M THAT GIRL

-- User 38 listening history
(38, 1, '2023-01-25 12:00:00', 240),   -- The 1
(38, 6, '2023-01-28 15:20:00', 190),   -- Willow
(38, 11, '2023-02-01 18:45:00', 200),  -- Anti-Hero
(38, 16, '2023-02-05 21:10:00', 233),  -- Shape of You
(38, 21, '2023-02-10 14:35:00', 194),  -- Bad Guy
(38, 26, '2023-02-15 17:50:00', 240),  -- Alone Again
(38, 31, '2023-02-20 20:25:00', 180),  -- Shut Up
(38, 36, '2023-02-25 13:40:00', 320),  -- Champagne Poetry
(38, 41, '2023-03-01 16:55:00', 180),  -- I'M THAT GIRL
(38, 46, '2023-03-05 19:20:00', 120),  -- BLOOD.

-- User 39 listening history
(39, 16, '2023-01-30 15:20:00', 233),  -- Shape of You
(39, 21, '2023-02-02 18:35:00', 194),  -- Bad Guy
(39, 26, '2023-02-05 21:50:00', 240),  -- Alone Again
(39, 31, '2023-02-10 14:15:00', 180),  -- Shut Up
(39, 36, '2023-02-15 17:30:00', 320),  -- Champagne Poetry
(39, 41, '2023-02-20 20:45:00', 180),  -- I'M THAT GIRL
(39, 46, '2023-02-25 13:20:00', 120),  -- BLOOD.
(39, 51, '2023-03-01 16:35:00', 240),  -- United In Grief
(39, 56, '2023-03-05 19:50:00', 200),  -- Green Light
(39, 61, '2023-03-10 22:15:00', 300),  -- Nikes

-- User 40 listening history
(40, 1, '2023-02-01 13:15:00', 240),   -- The 1
(40, 2, '2023-02-03 16:30:00', 195),   -- Cardigan
(40, 6, '2023-02-06 19:45:00', 190),   -- Willow
(40, 11, '2023-02-10 12:20:00', 200),  -- Anti-Hero
(40, 16, '2023-02-15 15:35:00', 233),  -- Shape of You
(40, 21, '2023-02-20 18:50:00', 194),  -- Bad Guy
(40, 26, '2023-02-25 21:05:00', 240),  -- Alone Again
(40, 31, '2023-03-01 14:40:00', 180),  -- Shut Up
(40, 36, '2023-03-05 17:55:00', 320),  -- Champagne Poetry
(40, 41, '2023-03-10 20:10:00', 180);  -- I'M THAT GIRL
