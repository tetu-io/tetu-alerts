import {Parser} from "./Parser";

// const script = process.env.SCRIPT
try {
  Parser.start()
} catch (e) {
  console.error('APP CRASHED', e);
}
