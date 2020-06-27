# Teaching-HEIGVD-RES-2020-Labo-Orchestra

## Admin

* **You can work in groups of 2 students**.
* It is up to you if you want to fork this repo, or if you prefer to work in a private repo. However, you have to **use exactly the same directory structure for the validation procedure to work**. 
* We expect that you will have more issues and questions than with other labs (because we have a left some questions open on purpose). Please ask your questions on Telegram / Teams, so that everyone in the class can benefit from the discussion.

## Objectives

This lab has 4 objectives:

* The first objective is to **design and implement a simple application protocol on top of UDP**. It will be very similar to the protocol presented during the lecture (where thermometers were publishing temperature events in a multicast group and where a station was listening for these events).

* The second objective is to get familiar with several tools from **the JavaScript ecosystem**. You will implement two simple **Node.js** applications. You will also have to search for and use a couple of **npm modules** (i.e. third-party libraries).

* The third objective is to continue practicing with **Docker**. You will have to create 2 Docker images (they will be very similar to the images presented in class). You will then have to run multiple containers based on these images.

* Last but not least, the fourth objective is to **work with a bit less upfront guidance**, as compared with previous labs. This time, we do not provide a complete webcast to get you started, because we want you to search for information (this is a very important skill that we will increasingly train). Don't worry, we have prepared a fairly detailed list of tasks that will put you on the right track. If you feel a bit overwhelmed at the beginning, make sure to read this document carefully and to find answers to the questions asked in the tables. You will see that the whole thing will become more and more approachable.


## Requirements

In this lab, you will **write 2 small NodeJS applications** and **package them in Docker images**:

* the first app, **Musician**, simulates someone who plays an instrument in an orchestra. When the app is started, it is assigned an instrument (piano, flute, etc.). As long as it is running, every second it will emit a sound (well... simulate the emission of a sound: we are talking about a communication protocol). Of course, the sound depends on the instrument.

* the second app, **Auditor**, simulates someone who listens to the orchestra. This application has two responsibilities. Firstly, it must listen to Musicians and keep track of **active** musicians. A musician is active if it has played a sound during the last 5 seconds. Secondly, it must make this information available to you. Concretely, this means that it should implement a very simple TCP-based protocol.

![image](images/joke.jpg)


### Instruments and sounds

The following table gives you the mapping between instruments and sounds. Please **use exactly the same string values** in your code, so that validation procedures can work.

| Instrument | Sound         |
|------------|---------------|
| `piano`    | `ti-ta-ti`    |
| `trumpet`  | `pouet`       |
| `flute`    | `trulu`       |
| `violin`   | `gzi-gzi`     |
| `drum`     | `boum-boum`   |

### TCP-based protocol to be implemented by the Auditor application

* The auditor should include a TCP server and accept connection requests on port 2205.
* After accepting a connection request, the auditor must send a JSON payload containing the list of <u>active</u> musicians, with the following format (it can be a single line, without indentation):

```
[
  {
  	"uuid" : "aa7d8cb3-a15f-4f06-a0eb-b8feb6244a60",
  	"instrument" : "piano",
  	"activeSince" : "2016-04-27T05:20:50.731Z"
  },
  {
  	"uuid" : "06dbcbeb-c4c8-49ed-ac2a-cd8716cbf2d3",
  	"instrument" : "flute",
  	"activeSince" : "2016-04-27T05:39:03.211Z"
  }
]
```

### What you should be able to do at the end of the lab


You should be able to start an **Auditor** container with the following command:

```
$ docker run -d -p 2205:2205 res/auditor
```

You should be able to connect to your **Auditor** container over TCP and see that there is no active musician.

```
$ telnet IP_ADDRESS_THAT_DEPENDS_ON_YOUR_SETUP 2205
[]
```

You should then be able to start a first **Musician** container with the following command:

```
$ docker run -d res/musician piano
```

After this, you should be able to verify two points. Firstly, if you connect to the TCP interface of your **Auditor** container, you should see that there is now one active musician (you should receive a JSON array with a single element). Secondly, you should be able to use `tcpdump` to monitor the UDP datagrams generated by the **Musician** container.

You should then be able to kill the **Musician** container, wait 10 seconds and connect to the TCP interface of the **Auditor** container. You should see that there is now no active musician (empty array).

You should then be able to start several **Musician** containers with the following commands:

```
$ docker run -d res/musician piano
$ docker run -d res/musician flute
$ docker run -d res/musician flute
$ docker run -d res/musician drum
```
When you connect to the TCP interface of the **Auditor**, you should receive an array of musicians that corresponds to your commands. You should also use `tcpdump` to monitor the UDP trafic in your system.


## Task 1: design the application architecture and protocols

| #  | Topic |
| --- | --- |
|Question | How can we represent the system in an **architecture diagram**, which gives information both about the Docker containers, the communication protocols and the commands? |
|  | ![](./images/DiagrammeQuestion1.png) |
|Question | Who is going to **send UDP datagrams** and **when**? |
| | Lorsqu'un musicien est actif il va envoyer un datagramme UDP chaque seconde |
|Question | Who is going to **listen for UDP datagrams** and what should happen when a datagram is received? |
| | L'auditeur va éctouer afin de recevoir les datagrammes des musiciens. Lorsqu'il recoit un datagramme, il doit enregistrer/mettre à jour ses datas. |
|Question | What **payload** should we put in the UDP datagrams? |
| | L'UUID du musicien,le bruit de son instrument et l'heure actuelle. On suppose alors que les containers aient leurs horloges synchronisées. |
|Question | What **data structures** do we need in the UDP sender and receiver? When will we update these data structures? When will we query these data structures? |
| | L'auditeur aura une map (un simple objet en javascript) dont la clé est l'UUID d'un musicien et la data son un objet qui contient l'instrument, l'heure du premier paquet reçu (activeSince) et l'heure du dernier paquet reçu. Lorsqu'il reçoit un datagramme d'un musicien, si l'UUID correspond à une clé de sa map il va update l'heure du dernier paquet reçu sinon il va créer une nouvelle entrée. Toutes les 5 secondes on devrai supprimer les entrées dont le dernier paquet a été reçu il y a plus de 5 secondes.Les musiciens auront des simples objets javascript contenant leur UUID, le bruit de son instrument et l'heure actuelle (au moment de l'envoi du datagramme). Lorsque son image sera run, il faudra update la valeur de l'instrument avec celui qui est passé en paramètre. L'heure actuelle devra être update avant chaque envoi de datagramme. |

## Task 2: implement a "musician" Node.js application

| #  | Topic |
| ---  | --- |
|Question | In a JavaScript program, if we have an object, how can we **serialize it in JSON**? |
| | On peut utiliser la fonction JSON.stringify()  |
|Question | What is **npm**?  | 
| | npm est le gestionnaire de packages pour la plateforme JavaScript Node. Il met des modules en place pour node puisse les trouver et gère intelligemment les conflits de dépendance.  |
|Question | What is the `npm install` command and what is the purpose of the `--save` flag?  |
| | La commande installe des packages mis en paramètre dans un dossier local node_modules. L'option --save est par default et permet de mettre à jour les dépendances des fichiers _package.json_ et _package-lock.json_.  |
|Question | How can we use the `https://www.npmjs.com/` web site?  |
| | On rentre le nom ("catégorie") d'un module que l'on recherche et une liste des modules disponibles correspondant nous est proposé. Il reste plus qu'a sélectionner le module qui correspond à notre besoin et l'installer avec npm install.
|Question | In JavaScript, how can we **generate a UUID** compliant with RFC4122? |
| | On peut utiliser un module npm appelé uuid, il est compatible avec la norme rfc4122|
|Question | In Node.js, how can we execute a function on a **periodic** basis? |
| | En utilisant la fonction setInterval() |
|Question | In Node.js, how can we **emit UDP datagrams**? |
| | En utilisant le module _dgram_ qui fournit une implémentation pour les UDP Datagram sockets  |
|Question | In Node.js, how can we **access the command line arguments**? |
| |  Il est possible d'obtenir les différents arguments de la command line via l'objet _process.argv_  |


## Task 3: package the "musician" app in a Docker image

| #  | Topic |
| ---  | --- |
|Question | How do we **define and build our own Docker image**?|
| | Depuis le dossier ou se trouve le Dockerfile: docker build -t nomImage . |
|Question | How can we use the `ENTRYPOINT` statement in our Dockerfile?  |
| | ENTRYPOINT nous permet de définir une commande qui va être lancée au début d'un container. Dans notre cas on lance node comme ceci : ENTRYPOINT ["node", "opt/app/index.js"] |
|Question | After building our Docker image, how do we use it to **run containers**?  |
| | docker run -d nomImage, si l'on a besoin de mapper des ports on peut utiliser l'option -p.  |
|Question | How do we get the list of all **running containers**?  |
| | docker ps  |
|Question | How do we **stop/kill** one running container?  |
| | docker kill nomContainer  |
|Question | How can we check that our runniEIGng containers are effectively sending UDP datagrams?  |
| | sudo tcpdump -i docker0 'port 2222'  |


## Task 4: implement an "auditor" Node.js application

| #  | Topic |
| ---  | ---  |
|Question | With Node.js, how can we listen for UDP datagrams in a multicast group? |
| | On utilise la methode addMembership sur un socket dgram.  |
|Question | How can we use the `Map` built-in object introduced in ECMAScript 6 to implement a **dictionary**?  |
| | En crééant une map selon la documentation |
|Question | How can we use the `Moment.js` npm module to help us with **date manipulations** and formatting?  |
| | Nous avons utilisé le module date-and-time à la place de Moment.js. Il suffit de l'installer, puis de préciser en au du fichier js dans lequel on veut l'utiliser require(date-and-time). Une méthode new Date()permet d'avoir la date actuelle. et la methode subtract(date1,date2).seconds() permet de connaître la différence entre 2 dates en secondes.|
|Question | When and how do we **get rid of inactive players**?  |
| | Grâce à setInterval nous exécutons le code d'une fonction toutes les 5 secondes. Elle va vérifier si tous les musiciens présent dans la map ont été actifs durant les dernières 5secondes. Si ce n'est pas les cas ils sont delete.|
|Question | How do I implement a **simple TCP server** in Node.js?  |
| | Avec un socket net on peut utiliser la fonction createServer |


## Task 5: package the "auditor" app in a Docker image

| #  | Topic |
| ---  | --- |
|Question | How do we validate that the whole system works, once we have built our Docker image? |
| | Quand on lance un container musicien "docker run res/musicien flute", l'on doit voir qu'il envoit un datagramme toutes les secondes (grâce à un console.log) comme configuré dans le fichier index.js. Grâce à tcpdump nous pouvons aussi observer que tous les musiciens lancés envoyent un datagramme toutes les secondes. Quand on lance l'auditeur on peut observer (consol.log) qu'il recoit des datagrammes grâce à son membership à l'adresse multicast. Telnet nous permet de nous connecter à l'auditeur grâce à une connexion tcp (telnet ip port) et un tableau contenant tous les musiciens actifs doit nous être retourné. Si un musicien devient inactif lors de la prochaine connexion tcp (>5sec plus tard) il ne devra plus apparaître dans le tableau. |


## Demo of the lab 

![](./images/orchestra.gif)

## Constraints

Please be careful to adhere to the specifications in this document, and in particular

* the Docker image names
* the names of instruments and their sounds
* the TCP PORT number

Also, we have prepared two directories, where you should place your two `Dockerfile` with their dependent files.

Have a look at the `validate.sh` script located in the top-level directory. This script automates part of the validation process for your implementation (it will gradually be expanded with additional operations and assertions). As soon as you start creating your Docker images (i.e. creating your Dockerfiles), you should try to run it.
