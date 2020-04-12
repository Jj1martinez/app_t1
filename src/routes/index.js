const KoaRouter = require('koa-router');
const pkg = require('../../package.json');
const axios = require('axios');

const router = new KoaRouter();
const url = 'https://integracion-rick-morty-api.herokuapp.com/';


router.get('/', async (ctx) => {
  console.log(ctx)
  var response = await axios.get(url+'api/episode')
  if ((response.data.info.pages)>1) {
    for (let index = 1; index < response.data.info.pages; index++) {
      let res = await axios.get(url+'api/episode?page='+(index+1).toString())
      res.data.results.forEach(element => {
            response.data.results.push(element);
      });
    }
  }
  console.log(response.data);
  await ctx.render('index', { data: response.data,
    profileEpisodePath: episode => ctx.router.url('episode.profile', { id: episode.id })});
});

router.get('episode.profile', 'episode/:id', async (ctx) => {
  var response = await axios.get(url+'api/episode/'+ctx.params.id)
  var characters = [];
  const n_charc= response.data.characters.length;
  // console.log(n_charc);
  for (let index = 0; index < n_charc; index++) {
    console.log(response.data.characters[index]);
    let matches = response.data.characters[index].toString().match(/(\d+)/);
    // console.log(matches[0]);
    characters.push(matches[0]);
  }
  // console.log(characters);
  var response2 = await axios.get(url+'api/character/'+characters.join(','));
  // console.log(response2.data);
  await ctx.render('episode',{data: response.data, characters:response2.data});
});


router.get('character.profile', 'character/:id', async (ctx) => {
  var response = await axios.get(url+'api/character/'+ctx.params.id)
  console.log(response.data);
  // Buscar Episodios
  var episodes = [];
  var episode_request = await axios.get(url+'api/episode')
  if ((episode_request.data.info.pages)>1) {
    for (let index = 1; index < episode_request.data.info.pages; index++) {
      let res = await axios.get(url+'api/episode?page='+(index+1).toString())
      res.data.results.forEach(element => {
        episode_request.data.results.push(element);
      });
    }  
  }
  // Tengo todos los episodios, buscamos el que coincida
  episode_request.data.results.forEach(element => {
    if (element.characters.indexOf(url+'api/character/'+ctx.params.id) > -1) {
      episodes.push(element.id.toString())
      // console.log(element.id.toString());
    }
  });
  // HAcemos la consulta 
  var response2 = await axios.get(url+'api/episode/'+episodes.join(','));
  //
  console.log(response2.data.length);
  // buscamos id de lugares
  let id_origin;
  if (response.data.origin.name!='unknown') {
    id_origin = response.data.origin.url.toString().match(/(\d+)/);
  }else{
    id_origin = '0';
  }
  console.log(response.data)
  let id_location = response.data.location.url.toString().match(/(\d+)/);
  console.log(id_origin);
  // 

  if (typeof response2.data.length !== "undefined") {
    // console.log(response2.data[0].name);
    await ctx.render('character',{data: response.data, episodes: response2.data,
    origin: id_origin, location: id_location})
  } else {
    await ctx.render('character',{data: response.data, episodes: [response2.data],
    origin: id_origin, location: id_location})
  }
});

router.get('location.profile', 'place/:id', async (ctx) => {
  var response = await axios.get(url+'api/location/'+ctx.params.id)
  var characters = [];
  const n_charc= response.data.residents.length;
  console.log(response.data);
  for (let index = 0; index < n_charc; index++) {
    // console.log(response.data.residents[index]);
    let matches = response.data.residents[index].toString().match(/(\d+)/);
    // console.log(matches[0]);
    characters.push(matches[0]);
  }
  // console.log(characters);
  var response2 = await axios.get(url+'api/character/'+characters.join(','));
  if (typeof response2.data.length !== "undefined") {
    await ctx.render('place',{data: response.data, characters:response2.data})
  }
  else{
    await ctx.render('place',{data: response.data, characters:[response2.data]})
  }
});


router.get('searchresults', 'search', async (ctx) => {
  console.log(ctx.query.name);
  var requests = [];
  for (let index = 0; index < 2; index++) {
    const request = axios.get(url+'api/episode?page='+(index+1).toString());
    requests.push(request);
  }
  for (let index = 0; index < 25; index++) {
    const request = axios.get(url+'api/character?page='+(index+1).toString());
    requests.push(request);
  }
  for (let index = 0; index < 4; index++) {
    const request = axios.get(url+'api/location?page='+(index+1).toString());
    requests.push(request);
  }
  var episodes_data_f=[];
  var character_data_f=[];
  var location_data_f=[];
  var counter= 0;
  const promesas = await axios.all(requests).then(
    axios.spread((...responses) => {
      var episodes_data=[];
      var character_data=[];
      var location_data=[];
      
      for (let index = 0; index < 2; index++) {
        episodes_data=episodes_data.concat(responses[index].data.results)    
      }
      for (let index = 2; index < 27; index++) {
        character_data=character_data.concat(responses[index].data.results) 
      }
      for (let index = 27; index < 31; index++) {
        location_data=location_data.concat(responses[index].data.results) 
      }

      // console.log(episodes_data[1]);
      // console.log(character_data[2]);
      // console.log(location_data[2]);
      // console.log(responseTwo.data);
      episodes_data.forEach(element=> {
        if (element.name.toUpperCase().indexOf(ctx.query.name.toUpperCase())>-1){
          episodes_data_f.push([element.name,element.id]);
          counter++;
        }
      })
      character_data.forEach(element=> {
        if (element.name.toUpperCase().indexOf(ctx.query.name.toUpperCase())>-1){
          character_data_f.push([element.name,element.id]);
          counter++;
        }
      })
      location_data.forEach(element=> {
        if (element.name.toUpperCase().indexOf(ctx.query.name.toUpperCase())>-1){
          location_data_f.push([element.name,element.id]);
          counter++;
        }
      
      })
      console.log(episodes_data_f);
      ctx.render('search',{episodes:episodes_data_f,characters:character_data_f,
        locations:location_data_f}) 
    })
  );
  await ctx.render('search',{episodes:episodes_data_f,characters:character_data_f,
    locations:location_data_f, counter:counter}) 


});





module.exports = router;
