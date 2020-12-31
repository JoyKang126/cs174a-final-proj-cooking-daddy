import {defs, tiny} from './examples/common.js';
import {is_colliding} from './collision.js';
import {mouse_pick_orig, intersect_ray_box, intersect_ray_plane} from './raycast.js';

// Pull these names into this module's scope for convenience:
const {Vector, Vector3, vec, vec3, vec4, color, hex_color, Mat4, Light, Shape, Material, Shader, Texture, Scene} = tiny;
const {Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere, Torus, Cylindrical_Tube,
        Capped_Cylinder, Shape_From_File} = defs;

export class Kitchen_Base extends Scene {
    // **Kitchen_Base** is a Scene that can be added to any display canvas.
    // This particular scene is broken up into two pieces for easier understanding.
    // The piece here is the base class, which sets up the machinery to draw a simple
    // scene demonstrating a few concepts.  A subclass of it, Kitchen,
    // exposes only the display() method, which actually places and draws the shapes,
    // isolating that code so it can be experimented with on its own.
    constructor() {                  // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.hover = this.swarm = false;
        // At the beginning of our program, load one of each of these shape
        // definitions onto the GPU.  NOTE:  Only do this ONCE per shape it
        // would be redundant to tell it again.  You should just re-use the
        // one called "box" more than once in display() to draw multiple cubes.
        // Don't define more than one blueprint for the same thing here.
        this.shapes = {
            'box': new Cube(),
            'ball': new Subdivision_Sphere(4),
            'tube': new Cylindrical_Tube(16, 16),
            'cylinder': new Capped_Cylinder(16, 16),
            'bowl': new Shape_From_File("assets/bowl.obj"),
            'chopped': new Shape_From_File("assets/chopped.obj"),
            'chopped2': new Shape_From_File("assets/chopped2.obj"),
            'torus': new Torus(20, 20)
        };

        // *** Materials: *** Define a shader, and then define materials that use
        // that shader.  Materials wrap a dictionary of "options" for the shader.
        // Here we use a Phong shader and the Material stores the scalar
        // coefficients that appear in the Phong lighting formulas so that the
        // appearance of particular materials can be tweaked via these numbers.
        const phong = new defs.Phong_Shader();
        const bump = new defs.Fake_Bump_Map(1);
        this.materials = {
            plastic: new Material(phong,
                {ambient: .2, diffusivity: .8, specularity: .5, color: color(.9, .5, .9, 1)}),
            metal: new Material(phong,
                {ambient: .2, diffusivity: .8, specularity: .8, color: color(.9, .5, .9, 1)}),
            wood: new Material(bump, {ambient: .5, texture: new Texture("assets/wood.png")}),
            onion: new Material(bump, {ambient: .5, texture: new Texture("assets/onion.png")}),
            tofu: new Material(bump, {ambient: .5, texture: new Texture("assets/tofu.png")}),
            kimchi: new Material(bump, {ambient: .5, texture: new Texture("assets/kimchi.png")}),
            ovendoor: new Material(bump,
                {ambient: 0.7, diffusivity: 1, specularity: 0.5, texture: new Texture("assets/door.png")}),
            marble: new Material(bump,
                {ambient: 0.7, diffusivity: 1, specularity: 0.5, texture: new Texture("assets/marble.jpg")}),
            floor: new Material(bump,
                {ambient: .5, diffusivity: 1, specularity: 0.5, texture: new Texture("assets/floor.jpg")}),
            wall: new Material(bump,
                {ambient: .5, diffusivity: 1, specularity: 0.5, texture: new Texture("assets/tanWall.png")}),
            soup: new Material(bump,
                {color:hex_color("#000000"),ambient: 1, diffusivity: 0.1, specularity: 0.1, texture: new Texture("assets/soup.jpg")}),
            soup_1: new Material(bump,
                {color:hex_color("#000000"),ambient: 1, diffusivity: 0.1, specularity: 0.1, texture: new Texture("assets/soup_1.jpg")}),
            soup_2: new Material(bump,
                {color:hex_color("#000000"),ambient: 1, diffusivity: 0.1, specularity: 0.1, texture: new Texture("assets/soup_2.jpg")}),
            score_0: new Material(bump,
                {ambient: 0.7, diffusivity: 1, specularity: 0.5, texture: new Texture("assets/score_0.png")}),
            score_1: new Material(bump,
                {ambient: 0.7, diffusivity: 1, specularity: 0.5, texture: new Texture("assets/score_1.png")}),
            score_2: new Material(bump,
                {ambient: 0.7, diffusivity: 1, specularity: 0.5, texture: new Texture("assets/score_2.png")}),
            score_3: new Material(bump,
                {ambient: 0.7, diffusivity: 1, specularity: 0.5, texture: new Texture("assets/score_3.png")}),
            score_4: new Material(bump,
                {ambient: 0.7, diffusivity: 1, specularity: 0.5, texture: new Texture("assets/score_4.png")}),
            score_5: new Material(bump,
                {ambient: 0.7, diffusivity: 1, specularity: 0.5, texture: new Texture("assets/score_5.png")}),
            score_6: new Material(bump,
                {ambient: 0.7, diffusivity: 1, specularity: 0.5, texture: new Texture("assets/score_6.png")}),
            meet_fresh: new Material(bump,
                {ambient: .5, diffusivity: 1, specularity: 0.5, texture: new Texture("assets/meet_fresh.jpg")}),
            ice_cream: new Material(bump,
                {ambient: .5, diffusivity: 1, specularity: 0.5, texture: new Texture("assets/ice_cream.jpg")}),
            window: new Material(bump,
                {ambient: .5, diffusivity: 1, specularity: 0.5, texture: new Texture("assets/sf.jpg")}),
            window1: new Material(bump,
                {ambient: .5, diffusivity: 1, specularity: 0.5, texture: new Texture("assets/sf1.jpg")}),
            window2: new Material(bump,
                {ambient: .5, diffusivity: 1, specularity: 0.5, texture: new Texture("assets/sf2.jpg")}),
        };
        this.white = new Material(new defs.Basic_Shader());

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 35), vec3(0, 7, 0), vec3(0, 1, 0));

        // For Countertop
        this.holding = "none";
        this.onboard = "none";
        this.ingredients = Object.freeze({"onion": 0, "tofu": 1, "kimchi": 2})
        this.cut_ingredients = [false, false, false]; // onion, kimchi, tofu
        this.added_ingredients = [false, false, false];

        //initialize vegetables
        let model_transform = Mat4.identity();

        this.tofu_transform = model_transform
            .times(Mat4.scale(0.4, 0.4, 0.6))
            .times(Mat4.translation(-26, 11, 14));
        this.onion_transform = model_transform
            .times(Mat4.scale(0.4, 0.35, 0.4))
            .times(Mat4.translation(-26, 12.5, 26));
        this.kimchi_transform = model_transform
            .times(Mat4.scale(0.6, 0.4, 0.8))
            .times(Mat4.translation(-16, 11, 7));

        //initialize arrays
        this.collidables = new Array();
    }

    make_control_panel() {
        // make_control_panel(): Sets up a panel of interactive HTML elements, including
        // buttons with key bindings for affecting this scene, and live info readouts.
        this.control_panel.innerHTML += "Directions: ";
        // The next line adds a live text readout of a data member of our Scene.
        this.live_string(box => {
            box.textContent = "Make some delicious kimchi jjigae to apologize to your angry girlfriend."
        });
        this.new_line();
        this.new_line();
        // Add buttons so the user can actively toggle data members of our Scene:
        this.key_triggered_button("Move Ingredients",["m"], () => {this.CHOP = false; this.MOVE ^= true});
        this.key_triggered_button("Chop Ingredients",["c"], () => {this.MOVE = false; this.CHOP ^= true});
        this.new_line();
        this.key_triggered_button("Start",["Control", "0"], () => this.attached = () => this.initial_camera_location);
        this.new_line();
        this.key_triggered_button("Stage 1: Prep the Ingredients",["Control", "1"], () => this.attached = () => this.countertop_transform);
        this.new_line();
        this.key_triggered_button("Stage 2: Make the soup",["Control", "2"], () => {
            this.attached = () => this.stove_transform;
            if (!this.STAGE2)
            {
                this.STAGE2=true;
                this.tofu_transform = Mat4.identity()
                    .times(Mat4.scale(0.4, 0.4, 0.6))
                    .times(Mat4.translation(-10,11,0));
                this.onion_transform = Mat4.identity()
                    .times(Mat4.scale(0.4, 0.35, 0.4))
                    .times(Mat4.translation(-10, 12.5, 5));
                this.kimchi_transform = Mat4.identity()
                    .times(Mat4.scale(0.6, 0.4, 0.8))
                    .times(Mat4.translation(-4, 11, 0));
            }
        });
        this.new_line();
        this.key_triggered_button("Stage 3: Plate everything",["Control", "3"], () => {
            this.attached = () => this.plating_transform
            if (!this.STAGE3)
            {
                this.STAGE3=true;
                var score = 0;
                for (var i = 0; i < 3; i++)
                {
                    if (this.cut_ingredients[i])
                        score += 1;
                    if (this.added_ingredients[i])
                        score+=1;
                }
                this.text_transform = Mat4.identity()
                    .times(Mat4.scale(3,1,2))
                    .times(Mat4.rotation(-Math.PI/2, 1, 0,0))
                    .times(Mat4.translation(4, -1.6, 3.5));

                this.jjigae_transform = Mat4.identity()
                    .times(Mat4.rotation(Math.PI/2, 1, 0, 0))
                    .times(Mat4.translation(12, 0, -4.6))
                    .times(Mat4.scale(1, 1, 0.1));

                switch(score){
                    case 0:
                        const murky_white = color(0.7,0.7,0.7,0.5);
                        this.jjigae_texture = this.materials.metal.override(murky_white);
                        this.score_texture = this.materials.score_0;
                        break;
                    case 1:
                        const murky_yellow = color(0.7,0.5,0,0.5);
                        this.jjigae_texture = this.materials.metal.override(murky_yellow);
                        this.score_texture = this.materials.score_1;
                        break;
                    case 2:
                        const pale_red = color(0.7,0,0,0.5);
                        this.jjigae_texture = this.materials.metal.override(pale_red);
                        this.score_texture = this.materials.score_2;
                        break;
                    case 3:
                        const dark_red = color(0.9,0.3,0,0.7);
                        this.jjigae_texture = this.materials.metal.override(dark_red);
                        this.score_texture = this.materials.score_3;
                        break;
                    case 4:
                        this.jjigae_texture = this.materials.soup_1;
                        this.score_texture = this.materials.score_4;
                        break;
                    case 5:
                        this.jjigae_texture = this.materials.soup;
                        this.score_texture = this.materials.score_5;
                        break;
                    case 6:
                        this.jjigae_texture = this.materials.soup_2;
                        this.score_texture = this.materials.score_6;
                        break;
                }
            }
        });
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.  We'll isolate out
        // the code that actually draws things into Kitchen, a
        // subclass of this Scene.  Here, the base class's display only does
        // some initial setup.

        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());

            // Define the global camera and projection matrices, which are stored in program_state.  The camera
            // matrix follows the usual format for transforms, but with opposite values (cameras exist as
            // inverted matrices).  The projection matrix follows an unusual format and determines how depth is
            // treated when projecting 3D points onto a plane.  The Mat4 functions perspective() and
            // orthographic() automatically generate valid matrices for one.  The input arguments of
            // perspective() are field of view, aspect ratio, and distances to the near plane and far plane.

            program_state.set_camera(this.initial_camera_location);
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        // *** Lights: *** Values of vector or point lights.  They'll be consulted by
        // the shader when coloring shapes.  See Light's class definition for inputs.
        const light_position = vec4(0, 25, 10, 0.8);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
        const light_position1 = vec4(5, 10, 10, 1);
        program_state.lights.push(new Light(light_position1, color(1, 1, 1, 1), 1000));
        /*
        const t = this.t = program_state.animation_time / 1000;
        const angle = Math.sin(t);
        const light_position = Mat4.rotation(angle, 1, 0, 0).times(vec4(0, -1, 1, 0));
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
        */
    }
}

export class Kitchen extends Kitchen_Base {
    // **Kitchen** is a Scene object that can be added to any display canvas.
    // This particular scene is broken up into two pieces for easier understanding.
    // See the other piece, Kitchen_Base, if you need to see the setup code.
    // The piece here exposes only the display() method, which actually places and draws
    // the shapes.  We isolate that code so it can be experimented with on its own.
    // This gives you a very small code sandbox for editing a simple scene, and for
    // experimenting with matrix transformations.

    display(context, program_state) {
        // display():  Called once per frame of animation.  For each shape that you want to
        // appear onscreen, place a .draw() call for it inside.  Each time, pass in a
        // different matrix value to control where the shape appears.

        // Variables that are in scope for you to use:
        // this.shapes.box:   A vertex array object defining a 2x2x2 cube.
        // this.shapes.ball:  A vertex array object defining a 2x2x2 spherical surface.
        // this.materials.metal:    Selects a shader and draws with a shiny surface.
        // this.materials.plastic:  Selects a shader and draws a more matte surface.
        // this.lights:  A pre-made collection of Light objects.
        // this.hover:  A boolean variable that changes when the user presses a button.
        // program_state:  Information the shader needs for drawing.  Pass to draw().
        // context:  Wraps the WebGL rendering context shown onscreen.  Pass to draw().

        // Call the setup code that we left inside the base class:
        super.display(context, program_state);

        const gray = hex_color("#d1d8de")
        const dark_gray = hex_color("#2e3238")
        const white = hex_color("#fefefe")
        const dark_red = color(0.9,0.3,0,0.7);
            
        // Variable model_transform will be a local matrix value that helps us position shapes.
        // It starts over as the identity every single frame - coordinate axes at the origin.
        let model_transform = Mat4.identity();
        // Draw a hierarchy of objects that appear connected together.  The first shape
        // will be the "parent" or "root" of the hierarchy.  The matrices of the
        // "child" shapes will use transformations that are calculated as relative
        // values, based on the parent shape's matrix.  Moving the root node should
        // therefore move the whole hierarchy.  To perform this, we'll need a temporary
        // matrix variable that we incrementally adjust (by multiplying in new matrix
        // terms, in between drawing shapes).  We'll draw the parent shape first and
        // then incrementally adjust the matrix it used to draw child shapes.

        //================ Draw the Scene ================
        //================================================

        // ==== Kitchen ====
        this.countertop_transform = model_transform
            .times(Mat4.scale(3, 4, 8))
            .times(Mat4.translation(-3, 0, .625));
        this.shapes.box.draw(context, program_state, this.countertop_transform, this.materials.marble);
        this.collidables.push(this.countertop_transform);

        this.stove_transform = model_transform
            .times(Mat4.scale(6, 4, 3))
            .times(Mat4.translation(0, 0, 0));
        this.shapes.box.draw(context, program_state, this.stove_transform, this.materials.metal.override(dark_gray));
        this.collidables.push(this.stove_transform);

        this.stoveback_transform = model_transform
            .times(Mat4.scale(6, 6, 0.5))
            .times(Mat4.translation(0, 0, -7));
        this.shapes.box.draw(context, program_state, this.stoveback_transform, this.materials.metal.override(dark_gray));

        this.stovedoor_transform = model_transform
            .times(Mat4.scale(4, 2, 3))
            .times(Mat4.translation(0, 0, .05));
        this.shapes.box.draw(context, program_state, this.stovedoor_transform, this.materials.ovendoor);

        this.plating_transform = model_transform
            .times(Mat4.scale(6, 4, 3))
            .times(Mat4.translation(2, 0, 0));
        this.shapes.box.draw(context, program_state, this.plating_transform, this.materials.marble);
        this.collidables.push(this.stove_transform);

        // Walls
        let wall_transform = model_transform
            .times(Mat4.scale(30, 30, 1))
            .times(Mat4.translation(0, 0, -5));
        this.shapes.box.draw(context, program_state, wall_transform, this.materials.wall);
        this.collidables.push(wall_transform);

        // window
        let window_transform = model_transform
            .times(Mat4.scale(3, 3, 1))
            .times(Mat4.translation(-1, 4, 0));
        this.shapes.box.draw(context, program_state, window_transform, this.materials.window);

        // window
        let window_transform1 = model_transform
            .times(Mat4.scale(3, 3, 1))
            .times(Mat4.translation(2, 4, 0));
        this.shapes.box.draw(context, program_state, window_transform1, this.materials.window1);

        // window
        let window_transform2 = model_transform
            .times(Mat4.scale(3, 3, 1))
            .times(Mat4.translation(5, 4, 0));
        this.shapes.box.draw(context, program_state, window_transform2, this.materials.window2);

        // side wall
        let wall_transform1 = model_transform
            .times(Mat4.scale(1, 30, 30))
            .times(Mat4.translation(-13, 0, 0));
        this.shapes.box.draw(context, program_state, wall_transform1, this.materials.wall);
        this.collidables.push(wall_transform1);

        // meet fresh pic
        let pic_transform1 = model_transform
            .times(Mat4.scale(1, 3, 3))
            .times(Mat4.translation(-12.5, 4, 2));
        this.shapes.box.draw(context, program_state, pic_transform1, this.materials.meet_fresh);

        // ice cream pic
        let pic_transform2 = model_transform
            .times(Mat4.scale(1, 3, 3))
            .times(Mat4.translation(-12.5, 4, 5));
        this.shapes.box.draw(context, program_state, pic_transform2, this.materials.ice_cream);

        // Floor
        let floor_transform = model_transform
            .times(Mat4.scale(30, 1, 30))
            .times(Mat4.translation(0, -6, 0));
        this.shapes.box.draw(context, program_state, floor_transform, this.materials.floor);

        // ==== Countertop Area ====
        this.cutting_board_transform = model_transform
            .times(Mat4.scale(1.2, 0.2, 1.6))
            .times(Mat4.translation(-7, 21, 5.5));
        this.shapes.box.draw(context, program_state, this.cutting_board_transform, this.materials.wood);
        this.collidables.push(this.cutting_board_transform);

        // Grabbable Things
        var grabbable = new Array();

        if (this.newPos && this.origPos)
        {
            if (this.holding == "tofu")
            {

                this.tofu_transform = this.tofu_last_pos
                    .times(Mat4.translation(0,3,0))
                    .times(Mat4.translation(this.newPos[0]-this.origPos[0],this.newPos[1]-this.origPos[1],this.newPos[2]-this.origPos[2]));
            }
        }
        else
            this.tofu_last_pos = this.tofu_transform; //save its last position
        grabbable.push(this.tofu_transform);

        if (this.newPos && this.origPos)
        {
            if (this.holding == "onion")
            {
                this.onion_transform = this.onion_last_pos
                    .times(Mat4.translation(0,3,0))
                    .times(Mat4.translation(this.newPos[0]-this.origPos[0],this.newPos[1]-this.origPos[1],this.newPos[2]-this.origPos[2]));
            }
        }
        else
            this.onion_last_pos = this.onion_transform; //save its last position
        grabbable.push(this.onion_transform);

        if (this.newPos && this.origPos)
        {
            if (this.holding == "kimchi")
            {
                this.kimchi_transform = this.kimchi_last_pos
                    .times(Mat4.translation(0,3,0))
                    .times(Mat4.translation(this.newPos[0]-this.origPos[0],this.newPos[1]-this.origPos[1],this.newPos[2]-this.origPos[2]));
            }
        }
        else
            this.kimchi_last_pos = this.kimchi_transform;
        grabbable.push(this.kimchi_transform);

        // ==== Stove Area ====
        let pot_transform = model_transform
            .times(Mat4.rotation(Math.PI/2, 1, 0, 0))
            .times(Mat4.translation(2.5, 1.5, -4))
            .times(Mat4.scale(1.2, 1.2, 2));
        this.shapes.tube.draw(context, program_state, pot_transform, this.materials.metal.override(gray));

        let potbot_transform = model_transform
            .times(Mat4.rotation(Math.PI/2, 1, 0, 0))
            .times(Mat4.translation(2.5, 1.5, -4))
            .times(Mat4.scale(1.19, 1.19, 1.2));
        this.shapes.cylinder.draw(context, program_state, potbot_transform, this.materials.metal.override(dark_red));

        let hotplate_transform0 = model_transform
            .times(Mat4.rotation(Math.PI/2, 1, 0, 0))
            .times(Mat4.translation(2.5, 1.5, -4))
            .times(Mat4.scale(1.2, 1.2, 0.2));
        this.shapes.torus.draw(context, program_state, hotplate_transform0, this.materials.metal.override(dark_gray));

        let hotplate_transform1 = model_transform
            .times(Mat4.rotation(Math.PI/2, 1, 0, 0))
            .times(Mat4.translation(2.5, -1.5, -4))
            .times(Mat4.scale(1.2, 1.2, 0.2));
        this.shapes.torus.draw(context, program_state, hotplate_transform1, this.materials.metal.override(dark_gray));

        let hotplate_transform2 = model_transform
            .times(Mat4.rotation(Math.PI/2, 1, 0, 0))
            .times(Mat4.translation(-2.5, 1.5, -4))
            .times(Mat4.scale(1.2, 1.2, 0.2));
        this.shapes.torus.draw(context, program_state, hotplate_transform2, this.materials.metal.override(dark_gray));

        let hotplate_transform3 = model_transform
            .times(Mat4.rotation(Math.PI/2, 1, 0, 0))
            .times(Mat4.translation(-2.5, -1.5, -4))
            .times(Mat4.scale(1.2, 1.2, 0.2));
        this.shapes.torus.draw(context, program_state, hotplate_transform3, this.materials.metal.override(dark_gray));

        // ==== Plating Area ====
        let bowl_transform = model_transform
            .times(Mat4.rotation(-Math.PI/2, 1, 0, 0))
            .times(Mat4.translation(12, 0, 4.6))
        this.shapes.bowl.draw(context, program_state, bowl_transform, this.materials.metal.override(white));

        //================ Mouse Controls & Stage 1's Point System================
        //=====================================================
        context.canvas.addEventListener("mousedown", e => {
            let raycast = mouse_pick_orig(e, context.canvas, program_state);

            for (var i = 0; i < grabbable.length; i++) {
                if (intersect_ray_box(grabbable[i], raycast)) {
                    if (this.MOVE) {
                        switch (grabbable[i]) {
                            case this.tofu_transform:
                                this.holding = "tofu";
                                break;
                            case this.onion_transform:
                                this.holding = "onion";
                                break;
                            case this.kimchi_transform:
                                this.holding = "kimchi";
                                break;
                        }

                        var planePos = Vector3.create(6, 4, 8);
                        var planeNorm = Vector3.create(0, 1, 0);
                        this.origPos = intersect_ray_plane(raycast, planeNorm, planePos);
                        this.gravity_falls = this.holding;
                    } else if (this.CHOP) {
                        switch (grabbable[i]) {
                            case this.tofu_transform:
                                if (is_colliding(this.cutting_board_transform, this.tofu_transform))
                                    this.cut_ingredients[this.ingredients.tofu] = true;
                                break;
                            case this.onion_transform:
                                if (is_colliding(this.cutting_board_transform, this.onion_transform))
                                    this.cut_ingredients[this.ingredients.onion] = true;
                                break;
                            case this.kimchi_transform:
                                if (is_colliding(this.cutting_board_transform, this.kimchi_transform))
                                    this.cut_ingredients[this.ingredients.kimchi] = true;
                                break;
                        }

                    }
                }
            }
        })
        if (this.holding != "none")
        {
            context.canvas.addEventListener("mousemove", e =>{
                let raycast = mouse_pick_orig(e, context.canvas, program_state);
                var planePos = Vector3.create(6,4,8);
                var planeNorm = Vector3.create(0,1,0);
                this.newPos = intersect_ray_plane(raycast,planeNorm,planePos);
            })
        }
        context.canvas.addEventListener("mouseup", e => {
            this.holding = "none";
            this.origPos = undefined;
            this.newPos = undefined;
        })


        //================ Gravity and Stage 2's Point System ================
        //================================================
        if (this.holding == "none")
        {
            switch (this.gravity_falls){
                case "onion":
                    if (is_colliding(potbot_transform, this.onion_transform))
                    {
                        this.onion_transform = this.onion_transform.times(Mat4.scale(0,0,0));
                        this.added_ingredients[this.ingredients.onion] = true;
                    }
                    for (var i = 0; i < this.collidables.length; i++) {
                        if (is_colliding(this.collidables[i], this.onion_transform))
                            var onion_collide = true;
                    }
                    if (!onion_collide)
                        this.onion_transform = this.onion_transform.times(Mat4.translation(0,-0.5,0));
                    break;
                case "tofu":
                    if (is_colliding(potbot_transform, this.tofu_transform))
                    {
                        this.tofu_transform = this.tofu_transform.times(Mat4.scale(0,0,0));
                        this.added_ingredients[this.ingredients.tofu] = true;
                    }
                    for (var i = 0; i < this.collidables.length; i++) {
                        if (is_colliding(this.collidables[i], this.tofu_transform))
                            var tofu_collide = true;
                    }
                    if (!tofu_collide)
                        this.tofu_transform = this.tofu_transform.times(Mat4.translation(0,-0.5,0));
                    break;
                case "kimchi":
                    if (is_colliding(potbot_transform, this.kimchi_transform))
                    {
                        this.kimchi_transform = this.kimchi_transform.times(Mat4.scale(0,0,0));
                        this.added_ingredients[this.ingredients.kimchi] = true;
                    }
                    for (var i = 0; i < this.collidables.length; i++) {
                        if (is_colliding(this.collidables[i], this.kimchi_transform))
                            var kimchi_collide = true;
                    }
                    if (!kimchi_collide)
                        this.kimchi_transform = this.kimchi_transform.times(Mat4.translation(0,-0.5,0));
                    break;
            }
        }


        //================ Stage 3: Plating ================
        //==================================================
        if(this.STAGE3)
        {
            this.shapes.box.draw(context, program_state, this.text_transform, this.score_texture);
            this.shapes.cylinder.draw(context, program_state, this.jjigae_transform, this.jjigae_texture);
        }


        //================ Draw the Ingredients ================
        //======================================================

        // Draw the onion
        if (this.cut_ingredients[this.ingredients.onion])
            this.shapes.chopped.draw(context, program_state, this.onion_transform, this.materials.onion);
        else
            this.shapes.ball.draw(context, program_state, this.onion_transform, this.materials.onion);

        // Draw the tofu
        if (this.cut_ingredients[this.ingredients.tofu])
            this.shapes.chopped2.draw(context, program_state, this.tofu_transform, this.materials.tofu);
        else
            this.shapes.box.draw(context, program_state, this.tofu_transform, this.materials.tofu);

        // Draw the kimchi
        if (this.cut_ingredients[this.ingredients.kimchi])
            this.shapes.chopped2.draw(context, program_state, this.kimchi_transform, this.materials.kimchi);
        else
            this.shapes.box.draw(context, program_state, this.kimchi_transform, this.materials.kimchi);


        //================ Smooth Camera Transitions ================
        //===========================================================
        if (this.attached){
            if (this.attached() == this.initial_camera_location) {
                //program_state.set_camera(this.initial_camera_location);
                let desired = (Mat4.inverse(this.initial_camera_location));
                let blending_factor = 0.07;
                desired = desired.map((x, i) => Vector.from(program_state.camera_transform[i]).mix( x, blending_factor));
                program_state.set_camera(Mat4.inverse(desired));
            }
            else{
                let desired = this.attached().times(Mat4.inverse(Mat4.scale(6, 4, 3)))
                                             .times(Mat4.rotation(-Math.PI/4,1,0,0))
                                             .times(Mat4.translation(0, 3, 13));
                if (this.attached() == this.countertop_transform){
                    desired = this.attached().times(Mat4.inverse(Mat4.scale(3, 4, 8)))
                                             .times(Mat4.rotation(-Math.PI/2,1,0,1))
                                             .times(Mat4.rotation(Math.PI/2,0,0,1))
                                             .times(Mat4.rotation(Math.PI/4,0,1,1))
                                             .times(Mat4.translation(-3, 3, 13));
                }
                let blending_factor = 0.07;
                desired = desired.map((x, i) => Vector.from(program_state.camera_transform[i]).mix( x, blending_factor));
                program_state.set_camera(Mat4.inverse(desired));
            }
        }
    }
}
