
module.exports = function(grunt){

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        info : {
            banner : "/****\n"+
                    " * Grapnel.js\n"+
                    " * https://github.com/EngineeringMode/Grapnel.js\n"+
                    " *\n"+
                    " * @author <%= pkg.author %>\n"+
                    " * @link <%= pkg.link %>\n"+
                    " * @version <%= pkg.version %>\n"+
                    " *\n"+
                    " * Released under MIT License. See LICENSE.txt or http://opensource.org/licenses/MIT\n"+
                    "*/\n\n"
        },
        uglify: {
            options: {
                banner: '<%= info.banner %>',
            },
            dist: {
                src: 'src/grapnel.js',
                dest : 'dist/grapnel.min.js'
            }
        },
        concat : {
            options : {
                banner : '<%= info.banner %>'
            },
            dist: {
                src: 'src/grapnel.js',
                dest : 'src/grapnel.js'
            }
        },
        qunit: {
            files: ['test/index.html']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    grunt.registerTask('default', ['uglify', 'concat', 'qunit']);

}