/**
 * Created by Olegzandr on 5/16/16.
 */


const a = {

	b: {
		c: 'g'
	}
};


const B = Object.assign({},a.b);

console.log(B);

a.b.x = 'm';


console.log(a.b.x);

console.log(B);


