import {categories, fetchProvider} from './catalog.js';
import config from './config.js';
import {el, picture, safeUrl, checked, date} from '/comunidad/shared/ui.js';
const $ = s => document.querySelector(s);
const params = new URLSearchParams(location.search), category = params.get('categoria') || 'vet', id = params.get('proveedor');
const communityUrl = `/comunidad/?autor=${encodeURIComponent(id || '')}`;
function link(label,url){const a=el('a',label,'directory-contact');a.href=url;return a;}
let client, before=null, busy=false, version=0;
const seen=new Set();
async function posts(){
 if(busy)return;busy=true;const current=version;$('#posts-more').hidden=true;$('#community-status').textContent='Cargando publicaciones…';
 try{const rows=checked(await client.rpc('community_feed',{p_before:before,p_limit:10,p_author:id}));if(current!==version)return;
 for(const post of rows){if(seen.has(post.id))continue;seen.add(post.id);const card=el('article',null,'business-post');card.append(el('small',date(post.created_at)),el('p',post.caption || ''));
 for(const media of post.media || []){if(!safeUrl(media.url))continue;if(media.type==='image')card.append(picture(media.url,'Publicación del negocio'));if(media.type==='video'){const video=el('video');video.src=safeUrl(media.url);video.controls=true;video.preload='metadata';video.playsInline=true;card.append(video);}}
 const a=link(`Ver publicación · ${post.comment_count || 0} comentarios`,`${communityUrl}#post-${post.id}`);card.append(a);$('#business-posts').append(card);}
 if(rows.length)before=rows.at(-1).created_at;$('#posts-more').hidden=rows.length<10;$('#community-status').textContent=seen.size?'':'Este negocio aún no tiene publicaciones visibles.';
 }catch{if(current===version){$('#community-status').textContent='No pudimos cargar las publicaciones. Puedes reintentar o entrar a la comunidad.';$('#posts-more').hidden=false;}}
 finally{if(current===version)busy=false;}
}
async function setupCommunity(){try{const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2');client=createClient(config.url,config.key,{auth:{storageKey:'peluvi-web-client'}});client.auth.onAuthStateChange((event,session)=>{setTimeout(()=>{version++;before=null;busy=false;seen.clear();$('#business-posts').replaceChildren();$('#posts-more').hidden=true;if(session?.user)posts();else $('#community-status').textContent='Inicia sesión en Comunidad con tu cuenta Peluvi para ver sus publicaciones.';},0);});}catch{$('#community-status').textContent='Entra a la comunidad para consultar sus publicaciones.';}}
$('#posts-more').addEventListener('click',posts);
try{
 const provider=await fetchProvider(category,id,AbortSignal.timeout(20000));
 document.title=`${provider.name} | Peluvi`;$('#name').textContent=provider.name;$('#category').textContent=categories[category].title;
 $('#location').textContent=provider.location || 'Ubicación no publicada';$('#visit-location').textContent=provider.location || 'Consulta la ubicación con el negocio.';
 $('#description').textContent=provider.description || 'El negocio aún no ha publicado una descripción.';
 $('#schedule').textContent=typeof provider.schedule==='string' ? provider.schedule || 'Consulta los horarios con el negocio.' : Object.entries(provider.schedule).map(([day,value])=>`${day}: ${typeof value==='string'?value:JSON.stringify(value)}`).join('\n');
 if(safeUrl(provider.image))$('#cover').append(picture(provider.image,provider.name));else $('#cover').textContent=categories[category].icon;
 if(provider.emergency)$('#badges').append(el('span','Atiende urgencias','directory-badge'));
 if(Number(provider.reviews)>0)$('#badges').append(el('p',`★ ${provider.rating} · ${provider.reviews} opiniones`));
 if(['vet','grooming'].includes(category))$('#actions').append(link('Agendar cita →',`/directorio/citas.html?categoria=${category}&proveedor=${encodeURIComponent(id)}`));
 let phone=String(provider.phone).replace(/\D/g,'');if(/^3\d{9}$/.test(phone))phone=`57${phone}`;if(phone.length>=7&&phone.length<=15){const a=link('Contactar por WhatsApp',`https://wa.me/${phone}`);a.target='_blank';a.rel='noopener noreferrer';$('#actions').append(a);}
 $('#service-list').replaceChildren(...(provider.services.length?provider.services:['Consulta los servicios disponibles con el negocio.']).map(s=>el('li',s)));
 const gallery=[...new Set([provider.image,...provider.gallery])].filter(safeUrl);if(gallery.length)gallery.forEach(url=>$('#photos').append(picture(url,`Galería de ${provider.name}`)));else $('#photos').append(el('p','El negocio aún no ha publicado fotos.'));
 $('#community-link').href=communityUrl;$('#profile-status').textContent='';$('#profile').hidden=false;setupCommunity();
}catch{$('#profile-status').textContent='No pudimos abrir este negocio. Vuelve al directorio e intenta de nuevo.';}
