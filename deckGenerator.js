const colors = ['red', 'blue', 'green', 'yellow'];
const fs = require('fs');
const regulars = new Array;
for(let i = 1; i < 10; i++){
    regulars.push(i);
}
for(let i = 1; i < 10; i++){
    regulars.push(i);
}
const res = {
    deck : []
}
for(let color of colors){
    for(let regular of regulars){
        let temp = [color, regular];
        res.deck.push(temp);
    }
}
// for(let i = 0; i < 4; i++){
//     res.deck.push(['reverse']);
//     res.deck.push(['wildDraw']);
//     res.deck.push(['pass']);
// }
fs.writeFile('./deck.json', JSON.stringify(res), (err)=>[
    console.log(err)
]);