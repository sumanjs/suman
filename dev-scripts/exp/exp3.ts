

type T = (x: number) => boolean;

let fn = function(a: string, b: boolean, c: T){};

fn('yes', true, (() => {

}) as any);

fn('yes', true, <any>(() => {

}));
