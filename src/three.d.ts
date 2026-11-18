declare module 'three' {
  const THREE: any;
  export = THREE;
}

declare module 'three/addons/environments/RoomEnvironment.js' {
  export class RoomEnvironment {
    constructor();
  }
}
