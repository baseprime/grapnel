
module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        info: {
            banner: "/****\n" +
            " * Grapnel\n" +
            " * https://github.com/baseprime/grapnel\n" +
            " *\n" +
            " * @author <%= pkg.author %>\n" +
            " * @link <%= pkg.link %>\n" +
            " *\n" +
            " * Released under MIT License. See LICENSE.txt or http://opensource.org/licenses/MIT\n" +
            "*/\n\n"
        },
        uglify: {
            options: {
                banner: '<%= info.banner %>'
            },
            dist: {
                files: {
                    'dist/grapnel.min.js': ['dist/grapnel.min.js']
                }
            }
        },
        connect: {
            server: {
                options: {
                    port: 3002,
                    hostname: '*',
                    base: './test'
                }
            }
        },
        qunit: {
            all: ['test/index.html']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    grunt.registerTask('default', ['uglify', 'qunit']);
    grunt.registerTask('build', ['uglify', 'qunit']);
    grunt.registerTask('test', ['qunit']);
    grunt.registerTask('serve-tests', ['connect:server:keepalive']);

}