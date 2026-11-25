// Documentacion de los endpoints para probarlos desde el navegador
const { env } = require('./env');

// Esquema para las respuestas que solo traen un mensaje
const messageResponse = {
    200: { description: 'Operación exitosa' },
    400: { description: 'Datos inválidos o regla de negocio no cumplida' },
    401: { description: 'Sesión no iniciada o expirada' },
    403: { description: 'Sin permisos para esta acción' },
    404: { description: 'Recurso no encontrado' }
};
const idParam = {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'uuid' }
};
const projectIdParam = {
    name: 'projectId',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'uuid' }
};

const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'DevSail API',
        version: '1.0.0',
        description: 'Documentación y pruebas de todos los endpoints de DevSail. Al ejecutar /api/auth/login la cookie httpOnly se guarda automáticamente en el navegador.'
    },
    servers: [
        {
            url: `http://localhost:${env.port}`,
            description: 'Servidor local'
        }
    ],
    tags: [
        { name: 'Health', description: 'Estado del servidor' },
        { name: 'Auth', description: 'Registro, verificación, inicio y cierre de sesión' },
        { name: 'Users', description: 'Perfil público y configuración de cuenta' },
        { name: 'Catalogs', description: 'Tipos de proyecto, tecnologías y motivos de reporte' },
        { name: 'Projects', description: 'Inicio, búsqueda, detalle y gestión de proyectos' },
        { name: 'Ratings', description: 'Calificaciones, comentarios y proyectos guardados' },
        { name: 'Reports', description: 'Reportes de contenido' },
        { name: 'Payments', description: 'Plan Pro, destacados con PayPal y estadísticas' },
        { name: 'Admin', description: 'Panel de administración y moderación' }
    ],
    paths: {
        // HEALTH
        '/api/health': {
            get: {
                tags: ['Health'],
                summary: 'Verifica que el servidor esté vivo',
                responses: { 200: { description: 'Servidor activo' } }
            }
        },

        // AUTH
        '/api/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Registra una cuenta nueva y envía código de 6 dígitos',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['fullName', 'username', 'email', 'password', 'acceptPrivacy', 'acceptTerms'],
                                properties: {
                                    fullName: { type: 'string', example: 'Roberto Angel' },
                                    username: { type: 'string', example: 'robdev' },
                                    email: { type: 'string', example: 'roberto@ejemplo.com' },
                                    password: { type: 'string', example: 'Password123' },
                                    confirmPassword: { type: 'string', example: 'Password123' },
                                    acceptPrivacy: { type: 'boolean', example: true },
                                    acceptTerms: { type: 'boolean', example: true }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Cuenta creada y código enviado' },
                    400: { description: 'Validación fallida' },
                    409: { description: 'Correo o usuario ya registrado' }
                }
            }
        },
        '/api/auth/verify-email': {
            post: {
                tags: ['Auth'],
                summary: 'Verifica el correo con el código de 6 dígitos e inicia sesión',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'code'],
                                properties: {
                                    email: { type: 'string', example: 'roberto@ejemplo.com' },
                                    code: { type: 'string', example: '123456' }
                                }
                            }
                        }
                    }
                },
                responses: messageResponse
            }
        },
        '/api/auth/resend-code': {
            post: {
                tags: ['Auth'],
                summary: 'Reenvía un nuevo código de verificación al correo',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email'],
                                properties: {
                                    email: { type: 'string', example: 'roberto@ejemplo.com' }
                                }
                            }
                        }
                    }
                },
                responses: messageResponse
            }
        },
        '/api/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Inicia sesión y guarda la cookie httpOnly en el navegador',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                properties: {
                                    email: { type: 'string', example: 'roberto@ejemplo.com' },
                                    password: { type: 'string', example: 'Password123' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Inicio de sesión exitoso (guarda cookie)' },
                    401: { description: 'Credenciales incorrectas' },
                    403: { description: 'Cuenta sin verificar' },
                    423: { description: 'Cuenta bloqueada temporalmente' }
                }
            }
        },
        '/api/auth/logout': {
            post: {
                tags: ['Auth'],
                summary: 'Cierra sesión y limpia la cookie',
                responses: { 200: { description: 'Sesión cerrada' } }
            }
        },
        '/api/auth/session': {
            get: {
                tags: ['Auth'],
                summary: 'Devuelve los datos del usuario logueado actualmente',
                responses: messageResponse
            }
        },
        '/api/auth/forgot-password': {
            post: {
                tags: ['Auth'],
                summary: 'Envía código de recuperación de contraseña al correo',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email'],
                                properties: {
                                    email: { type: 'string', example: 'roberto@ejemplo.com' }
                                }
                            }
                        }
                    }
                },
                responses: { 200: { description: 'Solicitud procesada' } }
            }
        },
        '/api/auth/reset-password': {
            post: {
                tags: ['Auth'],
                summary: 'Restablece la contraseña usando el código recibido',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'code', 'newPassword'],
                                properties: {
                                    email: { type: 'string', example: 'roberto@ejemplo.com' },
                                    code: { type: 'string', example: '123456' },
                                    newPassword: { type: 'string', example: 'NuevaPass123' }
                                }
                            }
                        }
                    }
                },
                responses: messageResponse
            }
        },
        '/api/auth/change-password': {
            put: {
                tags: ['Auth'],
                summary: 'Cambia la contraseña estando dentro de la cuenta',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['currentPassword', 'newPassword'],
                                properties: {
                                    currentPassword: { type: 'string', example: 'Password123' },
                                    newPassword: { type: 'string', example: 'NuevaPass123' }
                                }
                            }
                        }
                    }
                },
                responses: messageResponse
            }
        },

        // USERS
        '/api/users/me': {
            get: {
                tags: ['Users'],
                summary: 'Obtiene los datos completos de mi propia cuenta',
                responses: messageResponse
            },
            put: {
                tags: ['Users'],
                summary: 'Actualiza nombre, usuario, biografía y enlaces sociales',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['fullName', 'username'],
                                properties: {
                                    fullName: { type: 'string', example: 'roberto Angel' },
                                    username: { type: 'string', example: 'robdev' },
                                    bio: { type: 'string', example: 'Desarrollador full-stack y ciberseguridad.' },
                                    linkLinkedin: { type: 'string', example: 'https://linkedin.com/in/robdev' },
                                    linkWebsite: { type: 'string', example: 'https://robdev.mx' },
                                    linkGithub: { type: 'string', example: 'https://github.com/Lexor12' },
                                    linkGitlab: { type: 'string', example: '' },
                                    linkBitbucket: { type: 'string', example: '' },
                                    linkInstagram: { type: 'string', example: '' },
                                    linkYoutube: { type: 'string', example: '' }
                                }
                            }
                        }
                    }
                },
                responses: messageResponse
            },
            delete: {
                tags: ['Users'],
                summary: 'Elimina definitivamente la cuenta del desarrollador',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['password'],
                                properties: {
                                    password: { type: 'string', example: 'Password123' }
                                }
                            }
                        }
                    }
                },
                responses: messageResponse
            }
        },
        '/api/users/me/avatar': {
            post: {
                tags: ['Users'],
                summary: 'Sube o reemplaza la foto de perfil en base64',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['image'],
                                properties: {
                                    image: { type: 'string', example: 'data:image/png;base64,iVBORw0KGgo...' }
                                }
                            }
                        }
                    }
                },
                responses: messageResponse
            },
            delete: {
                tags: ['Users'],
                summary: 'Elimina la foto de perfil actual',
                responses: messageResponse
            }
        },
        '/api/users/profile/{username}': {
            get: {
                tags: ['Users'],
                summary: 'Devuelve el perfil público, estadísticas y proyectos de un usuario',
                parameters: [
                    { name: 'username', in: 'path', required: true, schema: { type: 'string', example: 'robdev' } },
                    { name: 'sortBy', in: 'query', required: false, schema: { type: 'string', enum: ['recent', 'rated'] } }
                ],
                responses: messageResponse
            }
        },

        // CATALOGS
        '/api/catalogs/projects': {
            get: {
                tags: ['Catalogs'],
                summary: 'Obtiene los tipos de proyecto y todas las tecnologías',
                responses: { 200: { description: 'Catálogos cargados' } }
            }
        },
        '/api/catalogs/report-reasons': {
            get: {
                tags: ['Catalogs'],
                summary: 'Obtiene los motivos disponibles para reportar contenido',
                responses: { 200: { description: 'Motivos cargados' } }
            }
        },

        // PROJECTS
        '/api/projects/home': {
            get: {
                tags: ['Projects'],
                summary: 'Obtiene destacados, mejor calificados y recientes para el inicio',
                responses: { 200: { description: 'Listas de inicio' } }
            }
        },
        '/api/projects/search': {
            get: {
                tags: ['Projects'],
                summary: 'Busca proyectos con filtros combinados y paginación',
                parameters: [
                    { name: 'text', in: 'query', schema: { type: 'string' } },
                    { name: 'typeCode', in: 'query', schema: { type: 'string' } },
                    { name: 'technologies', in: 'query', schema: { type: 'string', description: 'UUIDs separados por coma' } },
                    { name: 'minRating', in: 'query', schema: { type: 'number', example: 0 } },
                    { name: 'maxRating', in: 'query', schema: { type: 'number', example: 5 } },
                    { name: 'seekingFeedback', in: 'query', schema: { type: 'boolean' } },
                    { name: 'openToCollaborate', in: 'query', schema: { type: 'boolean' } },
                    { name: 'hasDemo', in: 'query', schema: { type: 'boolean' } },
                    { name: 'onlyFeatured', in: 'query', schema: { type: 'boolean' } },
                    { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['recent', 'rated', 'saved'] } },
                    { name: 'page', in: 'query', schema: { type: 'integer', example: 1 } },
                    { name: 'pageSize', in: 'query', schema: { type: 'integer', example: 12 } }
                ],
                responses: { 200: { description: 'Resultados paginados' } }
            }
        },
        '/api/projects/my-projects': {
            get: {
                tags: ['Projects'],
                summary: 'Lista todos los proyectos del desarrollador logueado',
                responses: messageResponse
            }
        },
        '/api/projects': {
            post: {
                tags: ['Projects'],
                summary: 'Publica un nuevo proyecto con imágenes y tecnologías',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['projectTypeId', 'title', 'nickname', 'description', 'repositoryUrl', 'authorshipDeclared', 'technologyIds', 'images'],
                                properties: {
                                    projectTypeId: { type: 'string', format: 'uuid' },
                                    title: { type: 'string', example: 'DevSail Platform' },
                                    nickname: { type: 'string', example: 'DevSail' },
                                    description: { type: 'string', example: 'Plataforma web para compartir y evaluar proyectos de software.' },
                                    repositoryUrl: { type: 'string', example: 'https://github.com/Lexor12/devsail' },
                                    demoUrl: { type: 'string', example: 'https://devsail.app' },
                                    seekingFeedback: { type: 'boolean', example: true },
                                    openToCollaborate: { type: 'boolean', example: true },
                                    authorshipDeclared: { type: 'boolean', example: true },
                                    technologyIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
                                    images: { type: 'array', items: { type: 'string', example: 'data:image/png;base64,...' } }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Proyecto publicado' },
                    400: { description: 'Validación fallida' },
                    403: { description: 'Límite gratuito alcanzado' },
                    409: { description: 'Repositorio duplicado' }
                }
            }
        },
        '/api/projects/{id}': {
            get: {
                tags: ['Projects'],
                summary: 'Obtiene el detalle completo de un proyecto y cuenta visita',
                parameters: [idParam],
                responses: messageResponse
            },
            put: {
                tags: ['Projects'],
                summary: 'Edita los datos de un proyecto existente',
                parameters: [idParam],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['projectTypeId', 'title', 'nickname', 'description', 'repositoryUrl', 'technologyIds'],
                                properties: {
                                    projectTypeId: { type: 'string', format: 'uuid' },
                                    title: { type: 'string', example: 'DevSail Platform v2' },
                                    nickname: { type: 'string', example: 'DevSail' },
                                    description: { type: 'string', example: 'Descripción actualizada del proyecto.' },
                                    repositoryUrl: { type: 'string', example: 'https://github.com/Lexor12/devsail' },
                                    demoUrl: { type: 'string', example: 'https://devsail.app' },
                                    seekingFeedback: { type: 'boolean', example: true },
                                    openToCollaborate: { type: 'boolean', example: false },
                                    technologyIds: { type: 'array', items: { type: 'string', format: 'uuid' } }
                                }
                            }
                        }
                    }
                },
                responses: messageResponse
            },
            delete: {
                tags: ['Projects'],
                summary: 'Elimina definitivamente un proyecto',
                parameters: [idParam],
                responses: messageResponse
            }
        },
        '/api/projects/{id}/status': {
            patch: {
                tags: ['Projects'],
                summary: 'Activa (published) o desactiva (deactivated) un proyecto',
                parameters: [idParam],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['status'],
                                properties: {
                                    status: { type: 'string', enum: ['published', 'deactivated'], example: 'deactivated' }
                                }
                            }
                        }
                    }
                },
                responses: messageResponse
            }
        },
        '/api/projects/{id}/images': {
            post: {
                tags: ['Projects'],
                summary: 'Agrega una nueva captura al proyecto (máximo 5)',
                parameters: [idParam],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['image'],
                                properties: {
                                    image: { type: 'string', example: 'data:image/png;base64,...' }
                                }
                            }
                        }
                    }
                },
                responses: messageResponse
            }
        },
        '/api/projects/{id}/images/reorder': {
            put: {
                tags: ['Projects'],
                summary: 'Cambia el orden de las imágenes del proyecto',
                parameters: [idParam],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['imageIds'],
                                properties: {
                                    imageIds: { type: 'array', items: { type: 'string', format: 'uuid' } }
                                }
                            }
                        }
                    }
                },
                responses: messageResponse
            }
        },
        '/api/projects/{id}/images/{imageId}': {
            delete: {
                tags: ['Projects'],
                summary: 'Elimina una imagen específica del proyecto',
                parameters: [
                    idParam,
                    { name: 'imageId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
                ],
                responses: messageResponse
            }
        },

        // RATINGS Y SAVED
        '/api/ratings/saved': {
            get: {
                tags: ['Ratings'],
                summary: 'Obtiene la lista personal de proyectos guardados',
                parameters: [
                    { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['recent', 'rated'] } }
                ],
                responses: messageResponse
            }
        },
        '/api/ratings/saved/{projectId}': {
            post: {
                tags: ['Ratings'],
                summary: 'Guarda o quita un proyecto de favoritos',
                parameters: [projectIdParam],
                responses: messageResponse
            }
        },
        '/api/ratings/project/{projectId}': {
            get: {
                tags: ['Ratings'],
                summary: 'Lista paginada de calificaciones y comentarios de un proyecto',
                parameters: [
                    projectIdParam,
                    { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['recent', 'highest', 'lowest'] } },
                    { name: 'page', in: 'query', schema: { type: 'integer', example: 1 } },
                    { name: 'pageSize', in: 'query', schema: { type: 'integer', example: 10 } }
                ],
                responses: { 200: { description: 'Lista de calificaciones' } }
            },
            post: {
                tags: ['Ratings'],
                summary: 'Crea o actualiza la calificación por 5 criterios y comentario',
                parameters: [projectIdParam],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['scoreDesign', 'scoreUsefulness', 'scoreCodeQuality', 'scoreDocumentation', 'scoreInnovation'],
                                properties: {
                                    scoreDesign: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                                    scoreUsefulness: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
                                    scoreCodeQuality: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                                    scoreDocumentation: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
                                    scoreInnovation: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                                    comment: { type: 'string', example: 'Muy buen proyecto, código limpio y bien documentado.' }
                                }
                            }
                        }
                    }
                },
                responses: messageResponse
            },
            delete: {
                tags: ['Ratings'],
                summary: 'Elimina mi calificación en este proyecto',
                parameters: [projectIdParam],
                responses: messageResponse
            }
        },

        // REPORTS
        '/api/reports': {
            post: {
                tags: ['Reports'],
                summary: 'Envía un reporte sobre un proyecto o un comentario',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['targetType', 'targetId', 'reasonId'],
                                properties: {
                                    targetType: { type: 'string', enum: ['project', 'comment'], example: 'project' },
                                    targetId: { type: 'string', format: 'uuid' },
                                    reasonId: { type: 'string', format: 'uuid' },
                                    detail: { type: 'string', example: 'El enlace al repositorio está roto o privado.' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Reporte enviado' },
                    400: { description: 'Datos inválidos' },
                    409: { description: 'Ya habías reportado este contenido' }
                }
            }
        },

        // PAYMENTS
        '/api/payments/me': {
            get: {
                tags: ['Payments'],
                summary: 'Obtiene el estado del Plan Pro, historial de pagos y precios',
                responses: messageResponse
            }
        },
        '/api/payments/pro-analytics': {
            get: {
                tags: ['Payments'],
                summary: 'Obtiene gráficas de visitas por día y por proyecto (solo Plan Pro)',
                parameters: [
                    { name: 'days', in: 'query', schema: { type: 'integer', enum: [7, 30, 90], example: 30 } },
                    { name: 'projectId', in: 'query', schema: { type: 'string', format: 'uuid' } }
                ],
                responses: messageResponse
            }
        },
        '/api/payments/paypal/create-order': {
            post: {
                tags: ['Payments'],
                summary: 'Crea una orden de pago en PayPal y devuelve la URL de aprobación',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['concept'],
                                properties: {
                                    concept: { type: 'string', enum: ['pro_plan', 'featured_7', 'featured_30'], example: 'pro_plan' },
                                    projectId: { type: 'string', format: 'uuid', description: 'Obligatorio si concept es featured_7 o featured_30' }
                                }
                            }
                        }
                    }
                },
                responses: { 201: { description: 'Orden creada con approveUrl' } }
            }
        },
        '/api/payments/paypal/capture-order': {
            post: {
                tags: ['Payments'],
                summary: 'Captura el pago aprobado en PayPal y activa el beneficio',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['orderId'],
                                properties: {
                                    orderId: { type: 'string', example: '5O190127TN364715T' }
                                }
                            }
                        }
                    }
                },
                responses: messageResponse
            }
        },
        '/api/payments/paypal/cancel-order': {
            post: {
                tags: ['Payments'],
                summary: 'Marca una orden pendiente como cancelada',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['orderId'],
                                properties: {
                                    orderId: { type: 'string', example: '5O190127TN364715T' }
                                }
                            }
                        }
                    }
                },
                responses: messageResponse
            }
        },

        // ADMIN
        '/api/admin/dashboard': {
            get: {
                tags: ['Admin'],
                summary: 'Obtiene las 6 tarjetas de resumen del panel de administración',
                responses: messageResponse
            }
        },
        '/api/admin/reports': {
            get: {
                tags: ['Admin'],
                summary: 'Lista paginada y filtrada de reportes agrupados',
                parameters: [
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'resolved_hidden', 'dismissed'] } },
                    { name: 'targetType', in: 'query', schema: { type: 'string', enum: ['project', 'comment'] } },
                    { name: 'reasonId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                    { name: 'dateFrom', in: 'query', schema: { type: 'string', example: '2026-11-01' } },
                    { name: 'dateTo', in: 'query', schema: { type: 'string', example: '2026-11-30' } },
                    { name: 'page', in: 'query', schema: { type: 'integer', example: 1 } },
                    { name: 'pageSize', in: 'query', schema: { type: 'integer', example: 10 } }
                ],
                responses: messageResponse
            }
        },
        '/api/admin/reports/{id}': {
            get: {
                tags: ['Admin'],
                summary: 'Detalle completo de un reporte y todas sus entradas individuales',
                parameters: [idParam],
                responses: messageResponse
            }
        },
        '/api/admin/reports/{id}/resolve': {
            patch: {
                tags: ['Admin'],
                summary: 'Resuelve un reporte pendiente ocultando el contenido o descartándolo',
                parameters: [idParam],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['decision', 'reason'],
                                properties: {
                                    decision: { type: 'string', enum: ['hide', 'dismiss'], example: 'hide' },
                                    reason: { type: 'string', example: 'El repositorio no existe o es privado.' }
                                }
                            }
                        }
                    }
                },
                responses: messageResponse
            }
        },
        '/api/admin/projects': {
            get: {
                tags: ['Admin'],
                summary: 'Lista paginada de proyectos para gestión del administrador',
                parameters: [
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['published', 'hidden', 'deactivated'] } },
                    { name: 'text', in: 'query', schema: { type: 'string' } },
                    { name: 'page', in: 'query', schema: { type: 'integer', example: 1 } },
                    { name: 'pageSize', in: 'query', schema: { type: 'integer', example: 10 } }
                ],
                responses: messageResponse
            }
        },
        '/api/admin/projects/{id}/visibility': {
            patch: {
                tags: ['Admin'],
                summary: 'Oculta o vuelve a mostrar un proyecto directamente',
                parameters: [idParam],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['action'],
                                properties: {
                                    action: { type: 'string', enum: ['hide', 'show'], example: 'hide' },
                                    reason: { type: 'string', example: 'Incumple las normas de contenido.' }
                                }
                            }
                        }
                    }
                },
                responses: messageResponse
            }
        },
        '/api/admin/comments': {
            get: {
                tags: ['Admin'],
                summary: 'Lista paginada de comentarios para gestión del administrador',
                parameters: [
                    { name: 'hidden', in: 'query', schema: { type: 'boolean' } },
                    { name: 'page', in: 'query', schema: { type: 'integer', example: 1 } },
                    { name: 'pageSize', in: 'query', schema: { type: 'integer', example: 10 } }
                ],
                responses: messageResponse
            }
        },
        '/api/admin/comments/{id}/visibility': {
            patch: {
                tags: ['Admin'],
                summary: 'Oculta o vuelve a mostrar el texto de un comentario',
                parameters: [idParam],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['action'],
                                properties: {
                                    action: { type: 'string', enum: ['hide', 'show'], example: 'hide' },
                                    reason: { type: 'string', example: 'Lenguaje ofensivo hacia el autor.' }
                                }
                            }
                        }
                    }
                },
                responses: messageResponse
            }
        },
        '/api/admin/featured': {
            get: {
                tags: ['Admin'],
                summary: 'Lista los proyectos destacados vigentes y los que vencen en menos de 24 horas',
                responses: messageResponse
            }
        },
        '/api/admin/featured/{projectId}/remove': {
            patch: {
                tags: ['Admin'],
                summary: 'Retira manualmente el destacado de un proyecto',
                parameters: [projectIdParam],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['reason'],
                                properties: {
                                    reason: { type: 'string', example: 'Proyecto con enlaces caídos durante periodo destacado.' }
                                }
                            }
                        }
                    }
                },
                responses: messageResponse
            }
        },
        '/api/admin/income': {
            get: {
                tags: ['Admin'],
                summary: 'Reporte de pagos e ingresos con filtros y resumen total',
                parameters: [
                    { name: 'dateFrom', in: 'query', schema: { type: 'string', example: '2026-11-01' } },
                    { name: 'dateTo', in: 'query', schema: { type: 'string', example: '2026-11-30' } },
                    { name: 'concept', in: 'query', schema: { type: 'string', enum: ['pro_plan', 'featured_7', 'featured_30'] } },
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['completed', 'pending', 'cancelled', 'failed'] } },
                    { name: 'username', in: 'query', schema: { type: 'string' } },
                    { name: 'page', in: 'query', schema: { type: 'integer', example: 1 } },
                    { name: 'pageSize', in: 'query', schema: { type: 'integer', example: 10 } }
                ],
                responses: messageResponse
            }
        }
    }
};

module.exports = { swaggerDocument };